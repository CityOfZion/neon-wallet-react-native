import BigInteger from 'bigi'
import bs58 from 'bs58'
import bs58check from 'bs58check'
import C from 'crypto-js'
import CryptoJS from 'crypto-js'
import ecurve from 'ecurve'
import scrypt from './scrypt'
import WIF from 'wif'

const NEP_HEADER = '0142'
const NEP_FLAG = 'e0'
const SCRYPT_PARAMS = {
    ITERATIONS: 16384,
    BLOCKSIZE: 8,
    PARALLEL_FACTOR: 8,
    KEY_LEN_BYTES: 64
}

/**
 * @typedef {Object} Account
 * @property {Buffer} privateKey The private key in hex    DONE
 * @property {Buffer} publicKeyEncoded The public key in encoded form   DONE
 * @property {Buffer} publicKeyHash Hash of the public key
 * @property {Buffer} programHash Program Hash to use for signing
 * @property {string} address Public address of the private key
 */

/**
 * Test if address is a valid public address
 * @param {string} address - public address
 * @return {boolean} True if valid
 */
export function isValidPublicAddress(address) {
    let result = false
    if (address !== undefined && address.length == 34 && address.charAt(0) == 'A') {
        let programHashBuffer = bs58.decode(address)
        let programFromHexString = CryptoJS.enc.Hex.parse(programHashBuffer.toString('hex', 0, 21))
        let programSHA256 = CryptoJS.SHA256(programFromHexString)
        let programSHA256_2 = CryptoJS.SHA256(programSHA256)
        let programBuffer = new Buffer(programSHA256_2.toString(), 'hex')

        // verify address
        if (programBuffer.readUInt32LE(0) ^ (programHashBuffer.readUInt32LE(21) == 0)) {
            result = true
        }
    }
    return result
}

export function isValidWIF(wif) {
    let result = false
    if (wif != undefined && wif.length == 52) {
        const response = getPrivateKeyFromWIF(wif)
        if (response) {
            result = true
        }
    }
    return result
}

/**
 * Get private key from WIF.
 * @param {Buffer|string} private key
 * @return {string} Private key
 */
export function getWIFFromPrivateKey(privateKey) {
    const COMPRESS = true
    if (!Buffer.isBuffer(privateKey)) {
        privateKey = new Buffer(privateKey, 'hex')
    }
    return WIF.encode(128, privateKey, COMPRESS)
}

/**
 * Get private key from WIF.
 * @param {string} wif (Wallet Import Format)
 * @return {Buffer|undefined} Private key if valid or undefined if invalid WIF format
 */
export function getPrivateKeyFromWIF(wif) {
    let privateKey = undefined
    let data = bs58.decode(wif)

    const COMPRESSED_TRUE_FLAG = 0x01
    const BITCOIN_MAINNET_FLAG = 0x80
    const PRIVATE_KEY_START = 1

    const BITCOIN_MAINNET_FLAG_LENGTH = 1
    const COMPRESSED_TRUE_FLAG_LENGTH = 1
    const PRIVATE_KEY_LENGTH = 32
    const CHECKSUM_LENGTH = 4
    const EXPECTED_LENGTH = BITCOIN_MAINNET_FLAG_LENGTH + PRIVATE_KEY_LENGTH + COMPRESSED_TRUE_FLAG_LENGTH + CHECKSUM_LENGTH

    if (data.length == EXPECTED_LENGTH && data[0] == BITCOIN_MAINNET_FLAG && data[33] == COMPRESSED_TRUE_FLAG) {
        privateKey = data.slice(PRIVATE_KEY_START, PRIVATE_KEY_START + PRIVATE_KEY_LENGTH)
    }
    return privateKey
}

/**
 * Get Account from WIF (Convenience function)
 * @param {string} WIFKey - WIF Key
 * @returns {Account|undefined} An Account object or undefined if errors encountered
 */
export function getAccountFromWIF(wif) {
    let account = undefined
    let privateKey = getPrivateKeyFromWIF(wif)

    if (privateKey != undefined) {
        account = getAccountFromPrivateKey(privateKey)
    }
    return account
}

/**
 * Encrypts a WIF using a given keyphrase under NEP-2 Standard.
 * @param {String} wif - WIF key to encrypt (52 chars long).
 * @param {string} passphrase - The password. Will be encoded as UTF-8.
 * @returns {string|undefined} If successful the encrypted key in Base58 (Case sensitive) otherwise undefined
 */
export function encryptWIF(wif, passphrase) {
    const account = getAccountFromWIF(wif)
    if (account) {
        // SHA Salt (use the first 4 bytes)
        const addressHash = CryptoJS.SHA256(CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(account.address)))
            .toString()
            .slice(0, 8)

        const derived = Buffer.from(
            scrypt(
                Buffer.from(passphrase, 'utf8'),
                Buffer.from(addressHash, 'hex'),
                SCRYPT_PARAMS.ITERATIONS,
                SCRYPT_PARAMS.BLOCKSIZE,
                SCRYPT_PARAMS.PARALLEL_FACTOR,
                SCRYPT_PARAMS.KEY_LEN_BYTES
            )
        )

        const derived1 = derived.slice(0, 32)
        const derived2 = derived.slice(32)
        // AES Encrypt
        const xor = XOR(account.privateKey, derived1)
        const encrypted = CryptoJS.AES.encrypt(
            CryptoJS.enc.Hex.parse(xor.toString('hex')),
            CryptoJS.enc.Hex.parse(derived2.toString('hex')),
            {
                mode: C.mode.ECB,
                padding: C.pad.NoPadding
            }
        )
        // Construct
        const assembled = NEP_HEADER + NEP_FLAG + addressHash + encrypted.ciphertext.toString()
        console.log('encrypted_assembled:', assembled)
        console.log('encrypted.addressHash', addressHash)
        return bs58check.encode(Buffer.from(assembled, 'hex'))
    }
}

/**
 * Decrypt a WIF using a given passphrase under NEP-2 Standard.
 * @param {string} encryptedWIF - existing WIF to decrypt (52 chars long).
 * @param {String} passphrase - The password. Will be encoded as UTF-8.
 * @returns {string|throw{Error}} If successful the encrypted key in Base58 (Case sensitive) or throws an Error if password wrong
 */
export function decryptWIF(encryptedWIF, passphrase) {
    const ADDRESS_HASH_OFFSET = Buffer.from(NEP_HEADER + NEP_FLAG, 'hex').length
    const ADDRESS_HASH_SIZE = 4

    const decodedData = bs58check.decode(encryptedWIF)
    const addressHash = decodedData.slice(ADDRESS_HASH_OFFSET, ADDRESS_HASH_OFFSET + ADDRESS_HASH_SIZE)
    const encrypted = decodedData.slice(-32)

    const derived = Buffer.from(
        scrypt(
            Buffer.from(passphrase, 'utf8'),
            addressHash,
            SCRYPT_PARAMS.ITERATIONS,
            SCRYPT_PARAMS.BLOCKSIZE,
            SCRYPT_PARAMS.PARALLEL_FACTOR,
            SCRYPT_PARAMS.KEY_LEN_BYTES
        )
    )
    const derived1 = derived.slice(0, 32)
    const derived2 = derived.slice(32)

    // AES Decrypt
    const cipherText = { ciphertext: CryptoJS.enc.Hex.parse(encrypted.toString('hex')), salt: '' }
    const derived2Hex = CryptoJS.enc.Hex.parse(derived2.toString('hex'))
    const decrypted = CryptoJS.AES.decrypt(cipherText, derived2Hex, {
        mode: C.mode.ECB,
        padding: C.pad.NoPadding
    })
    const decryptedBuffer = new Buffer(decrypted.toString(), 'hex')
    const privateKey = XOR(decryptedBuffer, derived1)
    const address = getAccountFromPrivateKey(privateKey).address

    const newAddressHash = CryptoJS.SHA256(CryptoJS.SHA256(CryptoJS.enc.Latin1.parse(address)))
        .toString()
        .slice(0, 8)
    const addressHashHex = addressHash.toString('hex')
    if (addressHashHex !== newAddressHash) throw new Error('Wrong Password!')
    return getWIFFromPrivateKey(privateKey)
}

/**
 * Encrypts a WIF using a given keyphrase under NEP-2 Standard.
 * @param {string} passphrase - The password. Will be encoded as UTF-8.
 * @param {String} existingWIF - Optional existing WIF to encrypt (52 chars long).
 * @returns {string|undefined} If successful the encrypted key in Base58 (Case sensitive) otherwise undefined
 */
export function generateEncryptedWIF(passphrase, existingWIF) {
    let result = undefined
    let wif
    if (existingWIF != undefined) {
        wif = existingWIF
    } else {
        wif = getWIFFromPrivateKey(generatePrivateKey())
    }
    const encryptedWIF = encryptWIF(wif, passphrase)
    const loadAccount = getAccountFromWIF(wif)

    if (encryptedWIF && loadAccount) {
        result = {
            wif,
            encryptedWIF,
            passphrase,
            address: loadAccount.address
        }
    }

    return result
}

/**
 * Constructs a ContractTransaction based on the given params. A ContractTransaction is a basic transaction to send NEO/GAS.
 * @param {Coin[]} coins - A list of relevant assets available at the address which the public key is provided.
 * @param {string} publicKeyEncoded - The encoded public key of the address from which the assets are coming from.
 * @param {string} toAddress - The address which the assets are going to.
 * @param {number|string} amount - The amount of assets to send.
 * @returns {string} A serialised transaction ready to be signed with the corresponding private key of publicKeyEncoded.
 */
// export function buildContractTransaction(coins, publicKeyEncoded, destinationAddress, amount) {
//     if (!isValidPublicAddress(destinationAddress)) {
//         throw new Error('Invalid destination address')
//     }
//     let programHash = bs58.decode(toAddress)
//     programHash = programHash.slice(1, 21)

//     let signatureScript = createSignatureScript(publicKeyEncoded)
//     let myProgramHash = getHash(signatureScript)

//     let inputData = getInputData(coins, amount)
// }

// coins = list
// taking it as is from https://github.com/hmcq6/neon-js/blob/39dc88c8068fd066e6b1ffdf4cf137f22c9d4974/src/wallet.js
// for the time being
// function getInputData(coins, amount) {
//     let coinOrdered = quickSort(coin.list, 0, coin.list - 1)
//     const sum = coinOrdered.reduce((sum, coin) => sum + parseFloat(coin.value), 0)

//     // if sum < amount then exit
//     let amount = parseFloat(amount)
//     if (sum < amount) return -1 // insufficientFunds

//     // find input coins
//     let k = 0
//     while (parseFloat(coinOrdered[k].value) <= amount) {
//         amount = amount - parseFloat(coinOrdered[k].value)
//         if (amount == 0) break
//         k = k + 1
//     }

//     /////////////////////////////////////////////////////////////////////////
//     // coin[0]- coin[k]

//     // 34 = index (1byte), txid (32 bytes), value (1byte)
//     const ENTRY_LENGTH = 34

//     // allocate enough space to store UTXO's
//     let data = new Uint8Array(1 + ENTRY_LENGTH * (k + 1))

//     // input count
//     data.set(hexstring2ab(numStoreInMemory((k + 1).toString(16), 2)))

//     for (let x = 0; x < k + 1; x++) {
//         // previous output hash reverse(txid)
//         data.set(reverseArray(hexstring2ab(coinOrdered[x].txid)), 1 + x * 34)
//         //data.set(hexstring2ab(coinOrdered[x]['txid']), pos);

//         // previous output index
//         //inputIndex = numStoreInMemory(coinOrdered[x]['n'].toString(16), 2);
//         data.set(hexstring2ab(numStoreInMemory(coinOrdered[x].index.toString(16), 4)), 1 + x * 34 + 32)
//     }

//     /////////////////////////////////////////////////////////////////////////

//     // calc coin_amount
//     let coinAmount = 0
//     for (let i = 0; i < k + 1; i++) {
//         coinAmount += parseFloat(coinOrdered[i].value)
//     }

//     /////////////////////////////////////////////////////////////////////////

//     return {
//         amount: coinAmount,
//         data
//     }
// }

/*
 *
 *  Internal usage functions 
 * 
 */

/**
 * Get hash of Buffer input
 * @param {Buffer} signatureScript
 * @returns {Buffer} Hashed output
 */
function getHash(signatureScript) {
    let ProgramHexString = CryptoJS.enc.Hex.parse(signatureScript.toString('hex'))
    let ProgramSha256 = CryptoJS.SHA256(ProgramHexString)
    return CryptoJS.RIPEMD160(ProgramSha256)
}

/**
 * Create Signature Script
 * @param {Buffer} publicKeyEncoded - encoded public key
 * @returns {Buffer} script
 */
function createSignatureScript(publicKeyEncoded) {
    let script = new Buffer('21' + publicKeyEncoded.toString('hex') + 'ac', 'hex')
    return script
}

/**
 * Constructs a valid NEO address from a scriptHash
 * @param {Buffer} scriptHash
 * @returns {string} A valid NEO address
 */
function getAddressFromScriptHash(scriptHash) {
    if (scriptHash.length !== 20) throw new Error('Invalid ScriptHash length')

    const ADDRESS_VERSION = 23 // addressVersion https://github.com/neo-project/neo/blob/master/neo/protocol.json

    let inputData = new Buffer(scriptHash.length + 1)
    inputData.writeInt8(ADDRESS_VERSION, 0)
    inputData.fill(scriptHash, 1)

    let scriptHashHex = CryptoJS.enc.Hex.parse(inputData.toString('hex'))
    let scriptHashSha256 = CryptoJS.SHA256(scriptHashHex)
    let scriptHashSha256_2 = CryptoJS.SHA256(scriptHashSha256)
    let scriptHashShaBuffer = new Buffer(scriptHashSha256_2.toString(), 'hex')

    const checksum = scriptHashShaBuffer.slice(0, 4)
    let outputData = new Buffer(1 + scriptHash.length + checksum.length)
    outputData.fill(inputData, 0)
    outputData.fill(checksum, inputData.length)

    return bs58.encode(outputData)
}

/**
 * Generate a `secure` random 32 byte private key.
 * @return {Buffer} Private key
 */
function generatePrivateKey() {
    const randomBytes = C.lib.WordArray.random(32)
    return Buffer.from(randomBytes.toString(), 'hex')
}

/**
 * Get public key from private key.
 * @param {Buffer} privateKey - Private Key.
 * @param {boolean} encode - If the returned public key should be encrypted. Defaults to true
 * @return {Buffer} Buffer containing the public key.
 */
function getPublicKey(privateKey, encode) {
    let ecparams = ecurve.getCurveByName('secp256r1')
    let curvePt = ecparams.G.multiply(BigInteger.fromBuffer(privateKey))
    return curvePt.getEncoded(encode)
}

/**
 * Bitwise XOR 2 arrays
 * @param {Buffer|string} a
 * @param {Buffer|string} b
 * @return {Buffer} a^b
 */
function XOR(a, b) {
    if (!Buffer.isBuffer(a)) a = new Buffer(a)
    if (!Buffer.isBuffer(b)) b = new Buffer(b)
    var res = []
    for (var i = 0; i < a.length; i++) {
        res.push(a[i] ^ b[i])
    }

    return new Buffer(res)
}

/**
 * Get Account from Private Key
 * @param {Buffer} privateKey - Private Key
 * @returns {Account} An Account object
 */
function getAccountFromPrivateKey(privateKey) {
    if (privateKey.length !== 32) {
        return -1
    }
    const publicKeyEncoded = getPublicKey(privateKey, true)

    /* get account from public key start */
    // verifyPublicKey(encodedPublicKey)?
    const publicKeyHash = getHash(publicKeyEncoded)
    const script = createSignatureScript(publicKeyEncoded)
    const scriptHash = getHash(script)
    const address = getAddressFromScriptHash(new Buffer(scriptHash.toString(), 'hex'))
    /* get account from public key end (getAccountFromPublicKey) */

    return { privateKey, publicKeyEncoded, publicKeyHash, scriptHash, address }
}

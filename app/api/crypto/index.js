import BigInteger from 'bigi'
import bs58 from 'bs58'
import bs58check from 'bs58check'
import C from 'crypto-js'
import CryptoJS from 'crypto-js'
import ecurve from 'ecurve'
import scrypt from './scrypt'
import WIF from 'wif'
import { ec } from 'elliptic'
import long from 'long'
import { getAssetId } from '../network'
import { XOR, reverse } from './utils'

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
 * @property {Buffer} privateKey The private key in hex
 * @property {Buffer} publicKeyEncoded The public key in encoded form
 * @property {Buffer} publicKeyHash Hash of the public key
 * @property {Buffer} programHash Program Hash to use for signing
 * @property {string} address Public address of the private key
 */

/**
* @typedef {Object} UTXO - Unspent Transaction Output
* @property {number} index - Previous transactoin index.
* @property {string} txid - Previous transaction hash.
* @property {number} value - Unspent amount.
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
        if ((programBuffer.readUInt32LE(0) ^ programHashBuffer.readUInt32LE(21)) == 0) {
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
 * @return {Buffer|error} Private key if valid or throws an error if the WIF format is invalid
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
    } else {
        throw new Error('Invalid WIF')
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
 * @param {string} passphrase - The password will be encoded as UTF-8 + NFC normalized.
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
                Buffer.from(passphrase.normalize('NFC'), 'utf8'),
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
        return bs58check.encode(Buffer.from(assembled, 'hex'))
    }
    return undefined
}

/**
 * Decrypt a WIF using a given passphrase under NEP-2 Standard.
 * @param {string} encryptedWIF - existing WIF to decrypt (52 chars long).
 * @param {String} passphrase - The password will be encoded as UTF-8.
 * @returns {string|throw{Error}} If successful the encrypted key in Base58 (Case sensitive) or throws an Error if password wrong
 */
export function decryptWIF(encryptedWIF, passphrase, scrypt_params = SCRYPT_PARAMS) {
    const ADDRESS_HASH_OFFSET = Buffer.from(NEP_HEADER + NEP_FLAG, 'hex').length
    const ADDRESS_HASH_SIZE = 4

    const decodedData = bs58check.decode(encryptedWIF)
    const addressHash = decodedData.slice(ADDRESS_HASH_OFFSET, ADDRESS_HASH_OFFSET + ADDRESS_HASH_SIZE)
    const encrypted = decodedData.slice(-32)

    const derived = Buffer.from(
        scrypt(
            Buffer.from(passphrase.normalize('NFC'), 'utf8'),
            addressHash,
            scrypt_params.ITERATIONS,
            scrypt_params.BLOCKSIZE,
            scrypt_params.PARALLEL_FACTOR,
            scrypt_params.KEY_LEN_BYTES
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
    if (addressHashHex !== newAddressHash) throw new Error('Wrong passphrase!')
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
 * Build the final contract data
 * @param {Buffer} transactionData - the constructed input/output data
 * @param {Buffer} transactionSignature - the signature over the transactionData
 * @param {Buffer} publicKeyEncoded - encoded public key
 * @returns {Buffer} raw transaction data ready to be send with the 'sendrawtransaction' RPC command
 */
export function buildRawTransaction(transactionData, transactionSignature, publicKeyEncoded) {
    const signatureScript = createSignatureScript(publicKeyEncoded)
    let offset = 0
    const magic = Buffer.from([0x01, 0x41, 0x40]) // something with signature count, struct size, signature length
    let data = Buffer.alloc(transactionData.length + transactionSignature.length + signatureScript.length + 4)

    data.fill(transactionData, offset, transactionData.length)
    offset += transactionData.length

    data.fill(magic, offset, offset + magic.length)
    offset += magic.length

    data.fill(transactionSignature, offset, offset + transactionSignature.length)
    offset += transactionSignature.length

    data.writeUInt8(0x23, offset)
    offset += 1

    data.fill(signatureScript, offset)

    return data
}

/**
 * Signs the transaction data with the private key
 * @property {Buffer} transactionData - transaction data to sign
 * @property {Buffer} privateKey - private key to sign the data with
 * @returns {Buffer} signature of transaction data
 */
export function signTransactionData(transactionData, privateKey) {
    const elliptic = new ec('p256')
    let preppedData = CryptoJS.enc.Hex.parse(transactionData.toString('hex'))
    const dataSHA256 = new Buffer(CryptoJS.SHA256(preppedData).toString(), 'hex')
    const sig = elliptic.sign(dataSHA256, privateKey, null)

    return Buffer.concat([sig.r.toArrayLike(Buffer, 'be', 32), sig.s.toArrayLike(Buffer, 'be', 32)])
}

/**
 * Constructs a ContractTransaction based on the given params. A ContractTransaction is a basic transaction to send NEO/GAS.
 * @param {UTXO[]} UTXOs - A list of Unspend Transactions records belonging to a specific address.
 * @param {string} assetId - Unique string identify the asset type 'NEO/GAS' (Uint256.toHex())
 * @param {string} publicKeyEncoded - The encoded public key of the address from which the assets are to be send.
 * @param {string} destinationAddress - The address to which the assets are going to be send.
 * @param {number|string} amount - The amount of assets to send.
 * @returns {Buffer} A transaction ready to be signed with the corresponding private key of publicKeyEncoded.
 */
export function buildContractTransactionData(UTXOs, assetId, publicKeyEncoded, destinationAddress, amount) {
    if (!isValidPublicAddress(destinationAddress)) {
        throw new Error('Invalid destination address')
    }

    let destinationAddressHash = bs58.decode(destinationAddress).slice(1, 21)
    let accountAddressHash = getHash(createSignatureScript(publicKeyEncoded)) // own pub key hash

    const CONTRACT_TRANSACTION_TYPE = 0x80
    const TRADING_VERSION = 0x00 // fixed for now -> http://docs.neo.org/en-us/node/network-protocol.html
    const TRANSACTION_ATTRIBUTES = 0x00 // no attributes
    const HEADER = Buffer.from([CONTRACT_TRANSACTION_TYPE, TRADING_VERSION, TRANSACTION_ATTRIBUTES])

    let { inputs, totalValueOfInputs } = buildInputDataFrom(UTXOs, amount)
    let outputs = buildOutputDataFrom(amount, totalValueOfInputs, assetId, accountAddressHash, destinationAddressHash)

    // final result = unsigned raw transaction
    return Buffer.concat([HEADER, inputs, outputs])
}

/**
 * Build the raw TX data for claiming GAS
 * @param {UTXO[]} claims - list of UTXO records. Example: http://testnet-api.wallet.cityofzion.io/v2/address/claims/<pubblic address> We only need a txid + index
 * @param {Number} amountToRecipient - amount of gas to send to self
 * @param {Buffer} publicKeyEncoded - encoded public key 
 */
export function buildClaimTransactionData(claims, amountToRecipient, publicKeyEncoded) {
    let accountAddressHash = getHash(createSignatureScript(publicKeyEncoded)) // own pub key hash

    const CLAIM_TRANSACTION_TYPE = 0x02
    const TRADING_VERSION = 0x00 // fixed for now -> http://docs.neo.org/en-us/node/network-protocol.html
    const TRANSACTION_ATTRIBUTES = 0x00 // no attributes
    const INPUT_COUNT = 0x00
    const OUTPUT_COUNT = 0x01

    const HEADER = Buffer.from([CLAIM_TRANSACTION_TYPE, TRADING_VERSION])
    const DATA2 = Buffer.from([TRANSACTION_ATTRIBUTES, INPUT_COUNT, OUTPUT_COUNT])

    let claimSpecificData = buildInputsDataStructure(claims) // the claims data structure is equal to that of inputs[]
    const outputData = getOutputEntryFrom(getAssetId('Gas'), amountToRecipient, accountAddressHash)

    return Buffer.concat([HEADER, claimSpecificData, DATA2, outputData])
}

/*
 *
 *  Internal usage functions 
 * 
 */

/**
 * Build outputs[] data 
 * @param {Number} amount - amount to be send
 * @param {Number} totalValueOfInputs - sum of UTXO's to be used to create outputs
 * @param {String} assetId - NEO / GAS network id
 * @param {Buffer} accountAddressHash - own account address hash
 * @param {Buffer} destinationAddressHash - recipient address hash
 */
export function buildOutputDataFrom(amount, totalValueOfInputs, assetId, accountAddressHash, destinationAddressHash) {
    // if we send our complete balance we need just 1 output entry
    // otherwise we need a second output to return the remainder of the balance to ourselves
    const OUTPUT_COUNT = amount == totalValueOfInputs ? 0x01 : 0x02
    const OUTPUT_ENTRY_SIZE = 60 // 32 assetId, 8 value, 20 scriptHash
    let offset = 0

    // First output -> asset to send to destination address
    let data = Buffer.alloc(1 + OUTPUT_COUNT * OUTPUT_ENTRY_SIZE)
    data.writeInt8(OUTPUT_COUNT, 0)
    offset += 1

    const NETWORK_STORAGE_MULTIPLIER = 100000000
    const amountToRecipient = Number(amount * NETWORK_STORAGE_MULTIPLIER)
    const entry0 = getOutputEntryFrom(assetId, amountToRecipient, destinationAddressHash)
    data.fill(entry0, offset, offset + entry0.length)

    if (OUTPUT_COUNT == 0x02) {
        // we have remaining funds to send back to ourselves
        offset += entry0.length

        const remainder = Number(totalValueOfInputs * NETWORK_STORAGE_MULTIPLIER - amountToRecipient)
        const entry1 = getOutputEntryFrom(assetId, remainder, accountAddressHash)
        data.fill(entry1, offset, offset + entry1.length)
    }

    return data
}

/**
 * Create a single output record
 * @param {string} assetId - Unique string identify the asset type 'NEO/GAS' (Uint256.toHex())
 * @param {Number} amount - The amount to send.
 * @param {Buffer} scripthash - scripthash of destination address
 */
function getOutputEntryFrom(assetId, amount, scripthash) {
    const ASSET_ID_LENGTH = 32
    const VALUE_LENGTH = 8
    const SCRIPTHASH_LENGTH = 20
    const OUTPUT_ENTRY_SIZE = ASSET_ID_LENGTH + VALUE_LENGTH + SCRIPTHASH_LENGTH

    let data = Buffer.alloc(OUTPUT_ENTRY_SIZE)
    offset = 0

    const reversedAssetId = reverse(Buffer.from(assetId, 'hex'))
    data.fill(reversedAssetId, offset, offset + ASSET_ID_LENGTH)
    offset += ASSET_ID_LENGTH

    // need extra 'long' package because javascript doesn't support logical AND on 64bits. It converts it internally to 32bit and does some .... things.
    let longValue = long.fromNumber(amount)
    data.writeInt32LE(longValue.low, offset)
    data.writeInt32LE(longValue.high, offset + 4)

    offset += VALUE_LENGTH

    data.fill(scripthash, offset, offset + SCRIPTHASH_LENGTH)

    return data
}

/**
 * Constructs the input data required to send `amountToSend` from the provided list of `UTXO` records
 * @param {UTXO[]} UTXOs 
 * @param {number|string} amountToSend 
 * @returns {Object} {{Buffer}inputs: Buffer of input data, {number}totalValueOfInputs: sum of UTXO values}
 */
export function buildInputDataFrom(UTXOs, amountToSend) {
    let orderedUTXOs = UTXOs
    for (let i = 0; i < orderedUTXOs.length - 1; i++) {
        for (let j = 0; j < orderedUTXOs.length - 1 - i; j++) {
            if (parseFloat(orderedUTXOs[j].value) < parseFloat(orderedUTXOs[j + 1].value)) {
                let temp = orderedUTXOs[j]
                orderedUTXOs[j] = orderedUTXOs[j + 1]
                orderedUTXOs[j + 1] = temp
            }
        }
    }
    const totalAvailableFunds = orderedUTXOs.reduce((sum, utxo) => sum + parseFloat(utxo.value), 0)

    // test for insufficient funding (althought this should already have been captured by the UI)
    if (parseFloat(amountToSend) > totalAvailableFunds) return -1 // TODO: figure out better error/exit way

    // calculate number of UTXO's required to have enough funds to send `amountToSend`
    let count = 0
    let totalValueOfInputs = 0
    for (let i = 0; i < orderedUTXOs.length; i++) {
        let value = parseFloat(orderedUTXOs[i].value)
        amountToSend -= value
        totalValueOfInputs += value
        if (amountToSend <= 0) {
            count = i + 1
            break
        }
    }

    let data = buildInputsDataStructure(orderedUTXOs.slice(0, count))

    return {
        inputs: data,
        totalValueOfInputs
    }
}

/**
 * Construct inputs[] data structure
 * @param {UTXO[]} UTXOs
 * @returns {Buffer} Input data (LEN + N * UTXO record) 
 */
function buildInputsDataStructure(UTXOs) {
    const INPUT_COUNT = UTXOs.length
    const INPUT_ENTRY_LENGTH = 34

    // construct input data
    let data = Buffer.alloc(1 + INPUT_ENTRY_LENGTH * INPUT_COUNT)
    data.writeInt16LE(INPUT_COUNT, 0)

    // foreach required input build a valid entry
    for (let i = 0; i < INPUT_COUNT; i++) {
        let offset = 1 + i * INPUT_ENTRY_LENGTH
        const inputEntry = getInputEntryFrom(UTXOs[i])

        data.fill(inputEntry, offset, INPUT_ENTRY_LENGTH + offset)
    }
    return data
}

/**
 * Constructs a raw input entry from an UTXO record
 * @param {UTXO} utxo - single record
 * @return {Buffer} a buffer containing the raw input entry data
 */
function getInputEntryFrom(utxo) {
    // 32 bytes previous hash
    // 2 bytes previous index
    let entry = Buffer.alloc(34)
    let reversedHash = reverse(Buffer.from(utxo.txid, 'hex'))
    entry.fill(reversedHash, 0, 32)
    entry.writeInt16LE(utxo.index, 32)
    return entry
}

/**
 * Get hash of Buffer input
 * @param {Buffer} signatureScript
 * @returns {Buffer} Hashed output
 */
export function getHash(signatureScript) {
    let ProgramHexString = CryptoJS.enc.Hex.parse(signatureScript.toString('hex'))
    let ProgramSha256 = CryptoJS.SHA256(ProgramHexString)
    return new Buffer(CryptoJS.RIPEMD160(ProgramSha256).toString(), 'hex')
}

/**
 * Create Signature Script
 * @param {Buffer} publicKeyEncoded - encoded public key
 * @returns {Buffer} script
 */
export function createSignatureScript(publicKeyEncoded) {
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
 * @param {boolean} encode - If the returned public key should be encoded. Defaults to true
 * @return {Buffer} Buffer containing the public key.
 */
function getPublicKey(privateKey, encode) {
    let ecparams = ecurve.getCurveByName('secp256r1')
    let curvePt = ecparams.G.multiply(BigInteger.fromBuffer(privateKey))
    return curvePt.getEncoded(encode)
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
    const address = getAddressFromScriptHash(scriptHash)
    /* get account from public key end (getAccountFromPublicKey) */

    return { privateKey, publicKeyEncoded, publicKeyHash, scriptHash, address }
}

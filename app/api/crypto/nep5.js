import { isValidPublicAddress, getHash, createSignatureScript, buildInputDataFrom, buildOutputDataFrom } from './index'
import bs58 from 'bs58'
import { reverse } from './utils'

/**
 * Get the raw script hex string for use in an invokescript rpc call
 * @param {String} token hash (hex)
 * @param {String} public address of account to check token balance of
 * @returns {Buffer} raw script data
 */
export function getTokenBalanceScript(token, address) {
    if (isValidPublicAddress(address)) {
        let programHashBuffer = bs58.decode(address)
        let scriptHash = programHashBuffer.slice(1, 21)

        const SCRIPTHASH_LEN = 0x14
        const OPCODE_PUSH1 = 0x51
        const OPCODE_PACK = 0xc1
        const OPERATION_LENGTH = 9
        const OPERATION = Buffer.from('balanceOf', 'utf8')
        const OPCODE_APPCALL = 0x67
        let token_scripthash_buffer = reverse(Buffer.from(token, 'hex'))

        // construct script
        let offset = 0
        let data = Buffer.alloc(54)

        data.writeUInt8(SCRIPTHASH_LEN, offset)
        offset += 1

        data.fill(scriptHash, offset, offset + scriptHash.length)
        offset += scriptHash.length

        data.writeUInt8(OPCODE_PUSH1, offset)
        data.writeUInt8(OPCODE_PACK, offset + 1)
        data.writeUInt8(OPERATION_LENGTH, offset + 2)
        offset += 3

        data.fill(OPERATION, offset, offset + OPERATION.length)
        offset += OPERATION.length

        data.writeUInt8(OPCODE_APPCALL, offset)
        offset += 1

        data.fill(token_scripthash_buffer, offset)

        return data
    } else {
        throw new Error('Invalid public address')
    }
}

/**
 * Build the raw script data for transfering a specific amount of a specific token from one address to another.
 * @param {String} token NEP5 token scripthash (hex string).
 * @param {*} fromAddr The encoded public key of the address from which the assets are to be send.
 * @param {*} toAddr The address to which the assets are going to be send.
 * @param {*} amount The number of tokens to send.
 * @returns {Buffer} constructed raw script data.
 */

function buildTokenTransferScript(token, fromAddr, toAddr, amount) {
    if (!isValidPublicAddress(toAddr)) {
        throw new Error('Invalid destination address')
    }

    let fromAddrScriptHash = getHash(createSignatureScript(fromAddr)) // own pub key hash
    let toAddrScriptHash = bs58.decode(toAddr).slice(1, 21)

    const OPCODE_PUSH1 = 0x51
    const SCRIPTHASH_LEN = 0x14
    const OPCODE_PUSH1_LEN3 = 0x53 // script parameters length
    const OPCODE_PACK = 0xc1
    const OPERATION_LENGTH = 8
    const OPERATION = Buffer.from('transfer', 'utf8')
    const OPCODE_APPCALL = 0x67
    let token_scripthash_buffer = reverse(Buffer.from(token, 'hex'))

    let offset = 0
    let data

    if (amount > 0 && amount <= 16) {
        const AMOUNT_TO_SENT = OPCODE_PUSH1 - 1 + amount
        data = Buffer.alloc(75)

        data.writeUInt8(AMOUNT_TO_SENT, offset)
        offset += 1
    } else if (amount > 16) {
        number = amount.toString(16)
        number = number.length % 2 ? '0' + number : number
        const AMOUNT_TO_SENT = reverse(Buffer.from(number, 'hex'))
        const len_amount = AMOUNT_TO_SENT.length

        // need to allocate more space
        data = Buffer.alloc(75 + len_amount)

        data.writeUInt8(len_amount, offset)
        offset += 1

        data.fill(AMOUNT_TO_SENT, offset, offset + AMOUNT_TO_SENT.length)
        offset += AMOUNT_TO_SENT.length
    } else {
        throw Errro('Invalid transfer amount')
    }

    // construct script
    data.writeUInt8(SCRIPTHASH_LEN, offset)
    offset += 1

    data.fill(toAddrScriptHash, offset, offset + SCRIPTHASH_LEN)
    offset += SCRIPTHASH_LEN

    data.writeUInt8(SCRIPTHASH_LEN, offset)
    offset += 1

    data.fill(fromAddrScriptHash, offset, offset + SCRIPTHASH_LEN)
    offset += SCRIPTHASH_LEN

    data.writeUInt8(OPCODE_PUSH1_LEN3, offset)
    data.writeUInt8(OPCODE_PACK, offset + 1)
    data.writeUInt8(OPERATION_LENGTH, offset + 2)
    offset += 3

    data.fill(OPERATION, offset, offset + OPERATION.length)
    offset += OPERATION.length

    data.writeUInt8(OPCODE_APPCALL, offset)
    offset += 1

    data.fill(token_scripthash_buffer, offset)

    return data
}

/**
 * Constructs an InvocationTransaction based on the given params. It is currently fixed to 'transfer' operation calls only.
 * @param {UTXO[]} UTXOs - A list of Unspend Transactions records belonging to a specific address.
 * @param {string} assetId - Unique string identify the asset type 'NEO/GAS' (Uint256.toHex()) - should always be GAS for this call
 * @param {string} publicKeyEncoded - The encoded public key of the address from which the assets are to be send.
 * @param {string} destinationAddress - The address to which the assets are going to be send.
 * @param {number} amount - The amount of tokens to send.
 * @param {String} token scripthash (hex string).
 */
export function buildInvocationTransactionData(UTXOs, assetId, publicKeyEncoded, destinationAddress, amount, token) {
    if (!isValidPublicAddress(destinationAddress)) {
        throw new Error('Invalid destination address')
    }
    let destinationAddressHash = bs58.decode(destinationAddress).slice(1, 21)
    let accountAddressHash = getHash(createSignatureScript(publicKeyEncoded)) // own pub key hash

    const INVOCATION_TRANSACTION_TYPE = 0xd1
    const INVOCATION_VERSION = 0x01
    const transfer_script = buildTokenTransferScript(token, publicKeyEncoded, destinationAddress, amount)
    const transfer_script_len = transfer_script.length

    const HEADER = Buffer.from([INVOCATION_TRANSACTION_TYPE, INVOCATION_VERSION, transfer_script_len])
    const gas_value = Buffer.from('0000000000000000', 'hex') // Fixed8(0) no gas value
    const TRANSACTION_ATTRIBUTES = Buffer.from('00', 'hex') // no attributes

    const gasAmount = 0.00000001

    let { inputs, totalValueOfInputs } = buildInputDataFrom(UTXOs, gasAmount)
    let outputs = buildOutputDataFrom(gasAmount, totalValueOfInputs, assetId, accountAddressHash, accountAddressHash) // send to self

    // final result = unsigned raw transaction
    return Buffer.concat([HEADER, transfer_script, gas_value, TRANSACTION_ATTRIBUTES, inputs, outputs])
}

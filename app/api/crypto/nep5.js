import { isValidPublicAddress } from './index'
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

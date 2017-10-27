import request from './request'
import { getAccountFromWIF, buildContractTransactionData, buildContract, signTransactionData } from '../crypto'
import { transferTransaction, signatureData, addContract, claimTransaction } from '../crypto/to_fix'

export function getBalance(address) {
    var path = '/v2/address/balance/' + address

    return request(path).then(response => {
        const neo = response.NEO
        const gas = response.GAS

        return { Neo: neo.balance, Gas: gas.balance, unspent: { Neo: neo.unspent, Gas: gas.unspent } }
    })
}

export function getWalletDBHeight() {
    var path = '/v2/block/height'
    return request(path).then(response => {
        return parseInt(response.block_height)
    })
}

export function getTransactionHistory(address) {
    var path = '/v2/address/history/' + address
    return request(path).then(response => {
        return response.history
    })
}

export function getClaimAmounts(address) {
    var path = '/v2/address/claims/' + address
    return request(path).then(response => {
        return { available: parseInt(response.total_claim), unavailable: parseInt(response.total_unspent_claim) }
    })
}

function getAssetId(assetType) {
    // more info here: http://docs.neo.org/en-us/node/api/getbalance.html
    const neoId = 'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b'
    const gasId = '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7'

    let assetId
    if (assetType === 'Neo') {
        assetId = neoId
    } else {
        assetId = gasId
    }
    return assetId
}

/**
 * Send an asset to an address
 * @param {string} destinationAddress - The destination address.
 * @param {string} WIF - The WIF of the originating address.
 * @param {string} assetType - The Asset. 'Neo' or 'Gas'.
 * @param {number} amount - The amount of asset to send.
 * @return {Promise<Response>} RPC Response
 */
export function sendAsset(destinationAddress, WIF, assetType, amount) {
    let assetId = getAssetId(assetType)
    const fromAccount = getAccountFromWIF(WIF)

    return getBalance(fromAccount.address).then(response => {
        const UTXOs = response.unspent[assetType]
        const txData = buildContractTransactionData(UTXOs, assetId, fromAccount.publicKeyEncoded, destinationAddress, amount)
        const signature = signTransactionData(txData, fromAccount.privateKey)
        const rawTXData = buildContract(txData, signature, fromAccount.publicKeyEncoded)

        return queryRPC('sendrawtransaction', [rawTXData.toString('hex')], 4)
    })
}

function getRPCEndpoint() {
    var path = '/v2/network/best_node'

    return request(path).then(response => {
        return response.node
    })
}

export const queryRPC = (method, params, id = 1) => {
    const jsonRpcData = { method, params, id, jsonrpc: '2.0' }
    return getRPCEndpoint().then(rpcEndpoint => {
        var options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonRpcData)
        }
        return request(rpcEndpoint, options, true).then(response => {
            return response
        })
    })
}

// TODO: refactor
export const doClaimAllGas = fromWif => {
    const account = getAccountFromWIF(fromWif)
    var path = '/v2/address/claims/' + account.address
    return request(path).then(response => {
        const claims = response['claims']
        const totalClaim = response['total_claim']
        const txData = claimTransaction(claims, account.publicKeyEncoded, account.address, totalClaim)
        const sign = signatureData(txData, account.privateKey)
        const txRawData = addContract(txData, sign, account.publicKeyEncoded)
        return queryRPC('sendrawtransaction', [txRawData], 2)
    })
}

import request from './request'
import {
    getAccountFromWIF,
    buildContractTransactionData,
    buildClaimTransactionData,
    buildRawTransaction,
    signTransactionData
} from '../crypto'
import { getTokenBalanceScript } from '../crypto/nep5'
import { reverse } from '../crypto/utils'

export function getBalance(address) {
    var path = '/v2/address/balance/' + address
    return request(path).then(response => {
        try {
            const neo = response.NEO
            const gas = response.GAS

            if (neo.balance == undefined || gas.balance == undefined || neo.unspent == undefined || gas.unspent == undefined) {
                throw new TypeError()
            }

            return { Neo: neo.balance, Gas: gas.balance, unspent: { Neo: neo.unspent, Gas: gas.unspent } }
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Return data malformed')
            } else {
                throw new Error(error)
            }
        }
    })
}

export function getWalletDBHeight() {
    var path = '/v2/block/height'
    return request(path).then(response => {
        let height = parseInt(response.block_height)
        if (isNaN(height)) {
            throw new Error('Return data malformed')
        }

        return height
    })
}

export function getTransactionHistory(address) {
    var path = '/v2/address/history/' + address
    return request(path).then(response => {
        try {
            if (response.history == undefined || !(response.history instanceof Array)) {
                throw new TypeError()
            }
            if (response.history) return response.history
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Return data malformed')
            } else {
                throw new Error(error)
            }
        }
    })
}

export function getClaimAmounts(address) {
    var path = '/v2/address/claims/' + address
    return request(path).then(response => {
        let available = parseInt(response.total_claim)
        let unavailable = parseInt(response.total_unspent_claim)

        if (isNaN(available) || isNaN(unavailable)) {
            throw new Error('Return data malformed')
        }

        return { available: available, unavailable: unavailable }
    })
}

export function getAssetId(assetType) {
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
        const rawTXData = buildRawTransaction(txData, signature, fromAccount.publicKeyEncoded)

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

export function claimAllGAS(fromWif) {
    const account = getAccountFromWIF(fromWif)

    var path = '/v2/address/claims/' + account.address
    return request(path).then(response => {
        const claims = response['claims']
        const totalClaim = response['total_claim']

        const txData = buildClaimTransactionData(claims, totalClaim, account.publicKeyEncoded)
        console.log(txData.toString('hex'))
        const signature = signTransactionData(txData, account.privateKey)
        const rawTXData = buildRawTransaction(txData, signature, account.publicKeyEncoded)
        return queryRPC('sendrawtransaction', [rawTXData.toString('hex')], 2)
    })
}

export function getMarketPriceUSD() {
    let fullURL = 'https://bittrex.com/api/v1.1/public/getticker?market=USDT-NEO'
    let options = {}
    let OVERRIDE_BASE_URL = true

    return request(fullURL, options, OVERRIDE_BASE_URL).then(response => {
        try {
            if (response.result.Last == undefined) {
                throw new TypeError()
            }
            return response.result.Last
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('Return data malformed')
            } else {
                throw new Error(error)
            }
        }
    })
}

export function getWalletDataFrom(url) {
    let options = {}
    let OVERRIDE_BASE_URL = true
    return request(url, options, OVERRIDE_BASE_URL).then(response => {
        try {
            data = {}
            data.scrypt = response.scrypt
            data.accounts = response.accounts.map(acc => {
                return { key: acc.key, label: acc.label }
            })
            return data
        } catch (error) {
            throw new Error('Wallet format invalid or corrupt')
        }
    })
}

/**
 * Get the balance of a NEP5 Token
 * @param {String} token hash (hex)
 * @param {String} public address of account to check token balance of
 * @returns {int} token abalance
 */

export function getTokenBalance(token, address) {
    const NETWORK_STORAGE_MULTIPLIER = 100000000
    return queryRPC('invokescript', [getTokenBalanceScript(token, address).toString('hex')], 2).then(response => {
        let valueBuf = Buffer.from(response.result.stack[0].value, 'hex')
        let value = parseInt(reverse(valueBuf).toString('hex'), 16) / NETWORK_STORAGE_MULTIPLIER

        if (isNaN(value)) {
            value = 0
        }
        return value
    })
}

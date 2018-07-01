import request from './request'
import {
    getAccountFromWIF,
    buildContractTransactionData,
    buildClaimTransactionData,
    buildRawTransaction,
    signTransactionData
} from '../crypto'
import { getTokenBalanceScript, buildInvocationTransactionData } from '../crypto/nep5'
import { reverse } from '../crypto/utils'
import { isNullOrUndefined } from 'util';

export function getBalance(address) {
    var path = '/api/main_net/v1/get_balance/' + address
    return request(path).then(response => {
        try {
            if (response.address === 'not found' || isNullOrUndefined(response.balance)) {
                return { Neo: 0, Gas: 0, unspent: { Neo: [], Gas: [] } }
            }

            let assets = {}
            response.balance.forEach(function (asset) {
                assets = { ...assets, [asset.asset]: { balance: asset.amount, unspent: asset.unspent } }
            })

            const neo = assets.NEO
            const gas = assets.GAS

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
    var path = '/api/main_net/v1/get_height'
    return request(path).then(response => {
        let height = parseInt(response.height)
        if (isNaN(height)) {
            throw new Error('Return data malformed')
        }

        return height
    })
}

export function getTransactionHistory(address) {
    var path = '/api/main_net/v1/get_address_abstracts/' + address + '/1'

    return request(path).then(response => {
        try {
            if (response.entries == undefined || !(response.entries instanceof Array)) {
                throw new TypeError()
            }
            if (response.entries) return response.entries
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
    var path = '/api/main_net/v1/get_claimable/' + address
    return request(path).then(response => {
        let total_available = parseFloat(response.unclaimed)
        let to_be_released = response.claimable // is a list[]

        if (isNaN(total_available) || isNullOrUndefined(to_be_released)) {
            throw new Error('Return data malformed')
        }

        return { total_available: total_available, to_be_released: to_be_released }
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
    // hardcode a Mainnet node RPC address, until we find a good replacement
    // for neon-wallet-db's `'/v2/network/best_node'` call. neoscan doesn't have one at this point.
    return new Promise(function (resolve, reject) {
        console.log("WARNING: RPC END POINT IS HARDCODED TO NEO MAINNET")
        resolve('http://neo-privnet:30333')
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
            return new Promise((resolve, reject) => {
                if (response.result == true) {
                    resolve({})
                } else {
                    reject({})
                }
            })
        })
    })
}

export function claimAllGAS(fromWif) {
    const account = getAccountFromWIF(fromWif)

    var path = '/api/main_net/v1/get_claimable/' + account.address
    return request(path).then(response => {
        const claimables = response['claimable']

        const txData = buildClaimTransactionData(claimables, account.publicKeyEncoded)
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

/**
 *
 * @param {string} destinationAddress - The destination address.
 * @param {string} WIF - The WIF of the originating address.
 * @param {string} token - token scripthash (hex string).
 * @param {number} amount - of tokens to sent
 * @return {Promise<Response>} RPC Response
 */
export function SendNEP5Asset(destinationAddress, WIF, token, amount) {
    let assetId = getAssetId('Gas')
    const fromAccount = getAccountFromWIF(WIF)

    return getBalance(fromAccount.address).then(response => {
        const UTXOs = response.unspent['Gas']
        // TODO: abort if UTXO's is 0, because it will throw an error in `buildContractTransactionData` specifically
        const txData = buildInvocationTransactionData(UTXOs, assetId, fromAccount.publicKeyEncoded, destinationAddress, amount, token)
        console.log(txData.toString('hex'))
        const signature = signTransactionData(txData, fromAccount.privateKey)
        const rawTXData = buildRawTransaction(txData, signature, fromAccount.publicKeyEncoded)

        return queryRPC('sendrawtransaction', [rawTXData.toString('hex')], 4)
    })
}

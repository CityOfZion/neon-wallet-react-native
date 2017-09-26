import { ActionConstants as actions } from '../actions'
import { getAccountsFromWIFKey } from 'neon-js'

export default function order(state = {}, action) {
    switch (action.type) {
        case actions.wallet.CREATE_WALLET_START:
            return { ...state, generating: true }
        case actions.wallet.CREATE_WALLET_SUCCESS:
            return {
                ...state,
                wif: action.data.wif,
                address: action.data.address,
                passphrase: action.data.passphrase,
                encryptedWif: action.data.encryptedWif,
                generating: false
            }
        case actions.wallet.SAVE_ENCRYPTED_KEY:
            let newKeysList = {
                ...state.saved_keys,
                [action.key]: action.name
            }
            return {
                ...state,
                saved_keys: newKeysList
            }

        case actions.wallet.RESET_STATE:
            return {
                ...state,
                wif: null,
                address: null,
                passphrase: null,
                encryptedWif: null,
                generating: false,
                decrypting: false,
                loggedIn: false,
                logInError: null,
                neo: 0,
                gas: 0,
                price: 0.0,
                transactions: [],
                claimAmount: 0
            }

        case actions.wallet.START_DECRYPT_KEYS:
            return {
                ...state,
                decrypting: true
            }
        case actions.wallet.LOGIN_SUCCESS:
            const account = getAccountsFromWIFKey(action.plainKey)[0]
            return {
                ...state,
                wif: action.plainKey,
                address: account.address,
                decrypting: false,
                loggedIn: true
            }
        case actions.wallet.LOGIN_ERROR:
            return {
                ...state,
                decrypting: false,
                loggedIn: false,
                logInError: action.error
            }
        case actions.wallet.LOGOUT: {
            return {
                ...state,
                loggedIn: false
            }
        }
        case actions.wallet.GET_BALANCE_SUCCESS: {
            return {
                ...state,
                neo: action.neo,
                gas: action.gas
            }
        }
        case actions.wallet.GET_MARKET_PRICE_SUCCESS: {
            return {
                ...state,
                price: action.price
            }
        }
        case actions.wallet.GET_TRANSACTION_HISTORY_SUCCESS: {
            let transactions = action.transactions
            let txs = []
            for (let i = 0; i < transactions.length; i++) {
                if (transactions[i].neo_sent === true) {
                    txs = txs.concat([
                        { type: 'NEO', amount: transactions[i].NEO, txid: transactions[i].txid, block_index: transactions[i].block_index }
                    ])
                }
                if (transactions[i].gas_sent === true) {
                    txs = txs.concat([
                        { type: 'GAS', amount: transactions[i].GAS, txid: transactions[i].txid, block_index: transactions[i].block_index }
                    ])
                }
            }
            return {
                ...state,
                transactions: txs
            }
        }
        case actions.wallet.GET_AVAILABLE_GAS_CLAIM_SUCCESS:
            const MAGIC_NETWORK_PROTOCOL_FORMAT = 100000000 // read more here: https://github.com/CityOfZion/neon-wallet-db#claiming-gas
            return {
                ...state,
                claimAmount: (action.claimAmounts.available + action.claimAmounts.unavailable) / MAGIC_NETWORK_PROTOCOL_FORMAT
            }
        default:
            return state
    }
}

import { ActionConstants as actions } from '../actions'
import { getAccountFromWIF } from '../api/crypto'

import { ASSET_TYPE } from '../actions/wallet'

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
                encryptedWIF: action.data.encryptedWIF,
                generating: false
            }
        case actions.wallet.RESET_STATE:
            return {
                ...state,
                wif: null,
                address: null,
                passphrase: null,
                encryptedWIF: null,
                generating: false,
                decrypting: false,
                loggedIn: false,
                logInError: null,
                neo: 0,
                gas: 0,
                price: 0.0,
                transactions: [],
                claimAmount: 0,
                claimUnspend: 0,
                updateSendIndicator: false,
                pendingBlockConfirm: false
            }

        case actions.wallet.START_DECRYPT_KEYS:
            return {
                ...state,
                decrypting: true
            }
        case actions.wallet.LOGIN_SUCCESS:
            const account = getAccountFromWIF(action.plainKey)
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
            let newState
            // we are not waiting for a transaction confirmation on the blockchain
            // update balance as normal
            if (!state.pendingBlockConfirm) {
                newState = {
                    ...state,
                    neo: action.neo,
                    gas: action.gas
                }
            } else {
                // ignore balance updates until our transaction is confirmed
                if (state.neo != action.neo && state.gas != action.neo) {
                    newState = state
                } else {
                    newState = {
                        ...state,
                        pendingBlockConfirm: false
                    }
                }
            }
            return newState
        }

        case actions.wallet.GET_MARKET_PRICE_SUCCESS: {
            return {
                ...state,
                price: action.price
            }
        }
        case actions.wallet.GET_TRANSACTION_HISTORY_SUCCESS: {
            let txs = action.transactions.map(tx => {
                if (tx.neo_sent == true) {
                    return { type: 'NEO', amount: tx.NEO, txid: tx.txid, block_index: tx.block_index }
                } else {
                    return { type: 'GAS', amount: tx.GAS, txid: tx.txid, block_index: tx.block_index }
                }
            })
            return {
                ...state,
                transactions: txs
            }
        }
        case actions.wallet.GET_AVAILABLE_GAS_CLAIM_SUCCESS:
            const MAGIC_NETWORK_PROTOCOL_FORMAT = 100000000 // read more here: https://github.com/CityOfZion/neon-wallet-db#claiming-gas
            return {
                ...state,
                claimAmount: (action.claimAmounts.available + action.claimAmounts.unavailable) / MAGIC_NETWORK_PROTOCOL_FORMAT,
                claimUnspend: action.claimAmounts.unavailable
            }

        case actions.wallet.SEND_ASSET_SUCCESS:
            if (action.sentToSelf == true) {
                /* Because we're sending to ourself, we don't want to freak out the user with showing
                 * an empty wallet while the blockchain confirms it's sent to ourselve. Therefore
                 * don't do the pre-emptive balance changing as below
                 */

                return state
            } else {
                // pre-emptively change asset value, to what has been send by the transaction for UX purpose
                let assetToChange = action.assetType === ASSET_TYPE.NEO ? 'neo' : 'gas'
                return {
                    ...state,
                    updateSendIndicators: true,
                    pendingBlockConfirm: true,
                    [assetToChange]: state[assetToChange] - action.amount
                }
            }
        case actions.wallet.SEND_ASSET_RESET_SEND_INDICATORS:
            return {
                ...state,
                updateSendIndicators: false
            }
        default:
            return state
    }
}

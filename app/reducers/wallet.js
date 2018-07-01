import { ActionConstants as actions } from '../actions'
import { getAccountFromWIF } from '../api/crypto'

import { ASSET_TYPE } from '../actions/wallet'

// TODO: get this list using 'api/main_net/v1/get_assets' because it can differ per network
assetType = {
    'c56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b': 'NEO',
    '602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7': 'GAS',
    'a87cc2a513f5d8b4a42432343687c2127c60bc3f': 'MCT',
    'ecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9': 'RPX',
    'ceab719b8baa2310f232ee0d277c061704541cfb': 'ONT',
    'daca711e1636a8ab4e5e2beedcd3815e2ac16fac': 'CDT',
    '584660c663f114d803928b77cb9abdd585a0fc17': 'PCG1'
}

const NETWORK_STORAGE_MULTIPLIER = 100000000 // read more here: https://github.com/CityOfZion/neon-wallet-db#claiming-gas

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
            let address = action.address
            let txs = action.transactions.map(tx => {
                let type = assetType[tx.asset]
                let amount = tx.amount

                if (type !== 'NEO' && type !== 'GAS') {
                    amount = amount / NETWORK_STORAGE_MULTIPLIER
                }

                if (tx.address_to != address) {
                    // we're sending funds and not receiving, so we need to convert the amount to a negative number
                    amount = amount * -1
                }
                return { type: type, amount: amount, txid: tx.txid, block_index: tx.block_height }
            })
            return {
                ...state,
                transactions: txs
            }
        }
        case actions.wallet.GET_AVAILABLE_GAS_CLAIM_SUCCESS:
            let claim_data = action.claimAmounts.to_be_released

            let sum_not_released = 0.0 // The sum of all funds that have to be released before they can be claimed.
            claim_data.forEach(item => {
                sum_not_released += item.unclaimed
            })
            return {
                ...state,
                claimAmount: action.claimAmounts.total_available,
                claimUnspend: sum_not_released
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

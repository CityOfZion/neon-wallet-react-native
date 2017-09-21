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
                generating: false
            }

        case actions.wallet.START_DECRYPT_KEYS:
            return {
                ...state,
                decrypting: true
            }
        case actions.wallet.LOGIN_SUCCESS:
            const account = getAccountsFromWIFKey(action.plain_key)[0]
            return {
                ...state,
                wif: action.plain_key,
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
        default:
            return state
    }
}

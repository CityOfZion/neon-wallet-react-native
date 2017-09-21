import { ActionConstants as actions } from '../actions'

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
        default:
            return state
    }
}

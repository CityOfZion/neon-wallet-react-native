const CREATE_WALLET = 'WALLET/CREATE'
const CREATE_WALLET_START = 'WALLET/CREATE_START_GENERATING'
const CREATE_WALLET_SUCCESS = 'WALLET/CREATE_SUCCESS'
const CREATE_WALLET_ERROR = 'WALLET/CREATE_ERROR'
const SAVE_ENCRYPTED_KEY = 'WALLET/SAVE_ENCRYPTED_KEY'
const RESET_STATE = 'WALLET/RESET_STATE'

export const constants = {
    CREATE_WALLET,
    CREATE_WALLET_START,
    CREATE_WALLET_SUCCESS,
    CREATE_WALLET_ERROR,
    SAVE_ENCRYPTED_KEY,
    RESET_STATE
}

export function createWallet(passphrase) {
    return {
        type: CREATE_WALLET,
        passphrase
    }
}

export function saveKey(key, name) {
    return {
        type: SAVE_ENCRYPTED_KEY,
        key,
        name
    }
}

export function resetWalletState() {
    return {
        type: RESET_STATE
    }
}

const CREATE_WALLET = 'WALLET/CREATE'
const CREATE_WALLET_START = 'WALLET/CREATE_START_GENERATING'
const CREATE_WALLET_SUCCESS = 'WALLET/CREATE_SUCCESS'
const CREATE_WALLET_ERROR = 'WALLET/CREATE_ERROR'
const SAVE_ENCRYPTED_KEY = 'WALLET/SAVE_ENCRYPTED_KEY'
const RESET_STATE = 'WALLET/RESET_STATE'
const LOGIN = 'WALLET/LOGIN'
const LOGOUT = 'WALLET/LOGOUT'
const LOGIN_SUCCESS = 'WALLET/LOGIN_SUCCESS'
const LOGIN_ERROR = 'WALLET/LOGIN_ERROR'
const START_DECRYPT_KEYS = 'WALLET/DECRYPTING_KEYS'

export const constants = {
    CREATE_WALLET,
    CREATE_WALLET_START,
    CREATE_WALLET_SUCCESS,
    CREATE_WALLET_ERROR,
    SAVE_ENCRYPTED_KEY,
    RESET_STATE,
    LOGIN,
    LOGIN_SUCCESS,
    LOGIN_ERROR,
    START_DECRYPT_KEYS,
    LOGOUT
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

export function resetState() {
    return {
        type: RESET_STATE
    }
}

export function login(passphrase, encryptedKey) {
    return {
        type: LOGIN,
        passphrase,
        encryptedKey
    }
}

export function logout() {
    return {
        type: LOGOUT
    }
}

const CREATE_WALLET = 'WALLET/CREATE'
const CREATE_WALLET_START = 'WALLET/CREATE_START'
const CREATE_WALLET_SUCCESS = 'WALLET/CREATE_SUCCESS'
const CREATE_WALLET_ERROR = 'WALLET/CREATE_ERROR'
const SAVE_ENCRYPTED_KEY = 'WALLET/SAVE_ENCRYPTED_KEY'
const RESET_STATE = 'WALLET/RESET_STATE'
const LOGIN = 'WALLET/LOGIN'
const LOGOUT = 'WALLET/LOGOUT'
const LOGIN_SUCCESS = 'WALLET/LOGIN_SUCCESS'
const LOGIN_ERROR = 'WALLET/LOGIN_ERROR'
const START_DECRYPT_KEYS = 'WALLET/DECRYPTING_KEYS'
const GET_BALANCE = 'WALLET/GET_BALANCE'
const GET_BALANCE_SUCCESS = 'WALLET/GET_BALANCE_SUCCESS'
const GET_BALANCE_ERROR = 'WALLET/GET_BALANCE_ERROR'
const GET_MARKET_PRICE = 'WALLET/GET_MARKET_PRICE'
const GET_MARKET_PRICE_SUCCESS = 'WALLET/GET_MARKET_PRICE_SUCCESS'
const GET_MARKET_PRICE_ERROR = 'WALLET/GET_MARKET_PRICE_ERROR'
const GET_TRANSACTION_HISTORY = 'WALLET/GET_TRANSACTION_HISTORY'
const GET_TRANSACTION_HISTORY_SUCCESS = 'WALLET/GET_TRANSACTION_HISTORY_SUCCESS'
const GET_TRANSACTION_HISTORY_ERROR = 'WALLET/GET_TRANSACTION_HISTORY_ERROR'
const SEND_ASSET = 'WALLET/SEND_ASSET'
const SEND_ASSET_SUCCESS = 'WALLET/SEND_ASSET_SUCCESS'
const SEND_ASSET_ERROR = 'WALLET/SEND_ASSET_ERROR'

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
    LOGOUT,
    GET_BALANCE,
    GET_BALANCE_SUCCESS,
    GET_BALANCE_ERROR,
    GET_MARKET_PRICE,
    GET_MARKET_PRICE_SUCCESS,
    GET_MARKET_PRICE_ERROR,
    GET_TRANSACTION_HISTORY,
    GET_TRANSACTION_HISTORY_SUCCESS,
    GET_TRANSACTION_HISTORY_ERROR,
    SEND_ASSET,
    SEND_ASSET_SUCCESS,
    SEND_ASSET_ERROR
}

export const ASSET_TYPE = {
    NEO: 'NEO',
    GAS: 'GAS'
}

export function create(passphrase) {
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
        key: encryptedKey,
        keyIsEncrypted: true
    }
}

export function loginWithPrivateKey(key) {
    return {
        type: LOGIN,
        passphrase: null,
        key,
        keyIsEncrypted: false
    }
}

export function logout() {
    return {
        type: LOGOUT
    }
}

export function sendAsset(toAddress, amount, assetType) {
    return {
        type: SEND_ASSET,
        toAddress,
        amount,
        assetType
    }
}

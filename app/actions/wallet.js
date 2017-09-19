const CREATE_WALLET = 'WALLET/CREATE'
const CREATE_WALLET_START = 'WALLET/CREATE_START_GENERATING'
const CREATE_WALLET_SUCCESS = 'WALLET/CREATE_SUCCESS'
const CREATE_WALLET_ERROR = 'WALLET/CREATE_ERROR'

export const constants = {
    CREATE_WALLET,
    CREATE_WALLET_START,
    CREATE_SUCCESS,
    CREATE_ERROR
}

export function createWallet(passphrase) {
    return {
        type: CREATE_WALLET,
        passphrase
    }
}

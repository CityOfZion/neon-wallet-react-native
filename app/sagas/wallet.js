import { delay } from 'redux-saga'
import { put, takeEvery, call, all, takeLatest } from 'redux-saga/effects'
import { generateEncryptedWif, decrypt_wif } from 'neon-js'

import { ActionConstants } from '../actions'
import { DropDownHolder } from '../utils/DropDownHolder'

export function* rootWalletSaga() {
    yield all([watchCreateWallet(), watchLoginWallet()])
}

/*
 *
 * Watchers 
 *
 */
function* watchCreateWallet() {
    yield takeEvery(ActionConstants.wallet.CREATE_WALLET, createWallet)
}

function* watchLoginWallet() {
    yield takeLatest(ActionConstants.wallet.LOGIN, loginWallet)
}

/*
 *
 * action takers 
 *
 */
function* createWallet(args) {
    const { passphrase } = args
    try {
        yield put({ type: ActionConstants.wallet.CREATE_WALLET_START })
        yield delay(1000) // to give the UI-thread time to show the 'generating view'
        const result = yield call(generateEncryptedWif, passphrase) // too computational heavy. Blocks Animations.
        // Breaking it up in the individual parts with delays didn't help
        // possibly using requestAnimationframe(()=>{call funcs here}) could work. try later

        yield put({ type: ActionConstants.wallet.CREATE_WALLET_SUCCESS, data: result })
    } catch (error) {
        yield put({ type: ActionConstants.wallet.CREATE_WALLET_ERROR, error })
    }
}

function* loginWallet(args) {
    const { passphrase, encryptedKey } = args
    try {
        yield put({ type: ActionConstants.wallet.START_DECRYPT_KEYS })
        yield delay(1000)
        const plain_key = yield call(decrypt_wif, encryptedKey, passphrase)
        yield put({ type: ActionConstants.wallet.LOGIN_SUCCESS, plain_key })
        // TODO: add watch for LOGOUT and make sure it only allows LOGIN if we're logged out etc. See redux-saga example flow
    } catch (error) {
        yield put({ type: ActionConstants.wallet.LOGIN_ERROR, error: 'Wrong passphrase' })
        DropDownHolder.getDropDown().alertWithType('error', 'Error', 'Wrong passphrase')
    }
}

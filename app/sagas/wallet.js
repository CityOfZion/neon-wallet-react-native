import { delay } from 'redux-saga'
import { put, takeEvery, call, all, takeLatest } from 'redux-saga/effects'
import { ActionConstants } from '../actions'
import { generateEncryptedWif } from 'neon-js'

export function* rootWalletSaga() {
    yield all([watchCreateWallet()])
}

/*
 *
 * Watchers 
 *
 */
function* watchCreateWallet() {
    yield takeEvery(ActionConstants.wallet.CREATE_WALLET, createWallet)
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

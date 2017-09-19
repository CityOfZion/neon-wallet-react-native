import { delay } from 'redux-saga'
import { put, takeEvery, call, all, takeLatest } from 'redux-saga/effects'
import { ActionConstants } from '../actions'
import { generateEncryptedWif } from 'neon-js'

export function* rootFeedbackSaga() {
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
        yield put({ type: ActionConstants.wallets.CREATE_WALLET_START })
        result = yield call(generateEncryptedWif, passphrase)
        yield put({ type: ActionConstants.wallets.CREATE_WALLET_SUCCESS, data: result })
    } catch (error) {
        yield put({ type: ActionConstants.wallets.CREATE_WALLET_ERROR, error })
    }
}

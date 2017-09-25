import { delay } from 'redux-saga'
import { put, takeEvery, call, all, takeLatest, select, fork, take } from 'redux-saga/effects'
import { getWallet, getNetwork } from './selectors'
import { generateEncryptedWif, decrypt_wif, getBalance, getTransactionHistory } from 'neon-js'

import { ActionConstants as actions } from '../actions'
import { DropDownHolder } from '../utils/DropDownHolder'
import { getMarketPriceUSD } from '../utils/walletStuff'

export function* rootWalletSaga() {
    yield all([watchCreateWallet(), watchLoginWallet(), watchSendAsset()])
}

/*
 *
 * Watchers 
 *
 */
function* watchCreateWallet() {
    yield takeEvery(actions.wallet.CREATE_WALLET, createWallet)
}

function* watchLoginWallet() {
    while (true) {
        const params = yield take(actions.wallet.LOGIN)
        yield fork(walletUseFlow, params)
        yield take([actions.wallet.LOGOUT, actions.wallet.LOGIN_ERROR])
    }
}

function* watchSendAsset() {
    yield takeEvery(actions.wallet.SEND_ASSET, sendAsset)
}

/*
 *
 * action takers 
 *
 */
function* createWallet(args) {
    const { passphrase } = args
    try {
        yield put({ type: actions.wallet.CREATE_WALLET_START })
        yield delay(1000) // to give the UI-thread time to show the 'generating view'
        const result = yield call(generateEncryptedWif, passphrase) // too computational heavy. Blocks Animations.
        // Breaking it up in the individual parts with delays didn't help
        // possibly using requestAnimationframe(()=>{call funcs here}) could work. try later

        yield put({ type: actions.wallet.CREATE_WALLET_SUCCESS, data: result })
    } catch (error) {
        console.log(error)
        yield put({ type: actions.wallet.CREATE_WALLET_ERROR, error })
    }
}

function* decryptWalletKeys(encryptedKey, passphrase) {
    try {
        yield put({ type: actions.wallet.START_DECRYPT_KEYS })
        yield delay(1000) // to allow UI to update before it gets locked by the computational heavy decrypt_wif function
        const plainKey = yield call(decrypt_wif, encryptedKey, passphrase)
        yield put({ type: actions.wallet.LOGIN_SUCCESS, plainKey })
    } catch (error) {
        yield put({ type: actions.wallet.LOGIN_ERROR, error: 'Wrong passphrase' })
        DropDownHolder.getDropDown().alertWithType('error', 'Error', 'Wrong passphrase')
    }
}

function* retrieveBalance(network, address) {
    try {
        yield put({ type: actions.wallet.GET_BALANCE })
        const balance = yield call(getBalance, network, address)
        yield put({ type: actions.wallet.GET_BALANCE_SUCCESS, neo: balance.Neo, gas: balance.Gas })
    } catch (error) {
        yield put({ type: actions.wallet.GET_BALANCE_ERROR, error: error })
    }
}

function* retrieveMarketPrice() {
    try {
        yield put({ type: actions.wallet.GET_MARKET_PRICE })
        const price = yield call(getMarketPriceUSD)
        yield put({ type: actions.wallet.GET_MARKET_PRICE_SUCCESS, price: price })
    } catch (error) {
        yield put({ type: actions.wallet.GET_MARKET_PRICE_ERROR, error: error })
    }
}

function* retrieveTransactionHistory(network, address) {
    try {
        yield put({ type: actions.wallet.GET_TRANSACTION_HISTORY })
        const transactions = yield call(getTransactionHistory, network, address)
        yield put({ type: actions.wallet.GET_TRANSACTION_HISTORY_SUCCESS, transactions: transactions })
    } catch (error) {
        yield put({ type: actions.wallet.GET_TRANSACTION_HISTORY_ERROR, error: error })
    }
}

function* walletUseFlow(args) {
    const { key, passphrase, keyIsEncrypted } = args

    if (keyIsEncrypted) {
        yield fork(decryptWalletKeys, key, passphrase)
        yield take(actions.wallet.LOGIN_SUCCESS)
    } else {
        yield put({ type: actions.wallet.LOGIN_SUCCESS, plainKey: key })
    }
    // Note: must get `wallet` state slice after LOGIN_SUCCESS, otherwise `address` is not yet updated
    const wallet = yield select(getWallet)
    const network = yield select(getNetwork)

    yield all([
        call(retrieveBalance, network.net, wallet.address),
        call(retrieveMarketPrice),
        call(retrieveTransactionHistory, network.net, wallet.address)
    ])
    // TODO: getClaimAmounts (neon-js)
    // TODO: implement retries on failed balance/marketprice/claim calls
    // TODO: should we start a background task that monitors the network for neo/gas updates or stick to manual to preserve bandwidth on mobile phone?
}

function* sendAsset(args) {
    const { assetType, toAddress, amount } = args
    const wallet = yield select(getWallet)
    const network = yield select(getNetwork)

    try {
        yield call(doSendAsset, network.net, toAddress, wallet.wif, assetType, amount)
        yield put({ type: actions.wallet.SEND_ASSET_SUCCESS })
        DropDownHolder.getDropDown().alertWithType(
            'success',
            'Success',
            'Transaction complete! Your balance will automatically update when the blockchain has processed it.'
        )

        // update balance and transaction history
        yield all([call(retrieveBalance, network.net, wallet.address), call(retrieveTransactionHistory, network.net, wallet.address)])
    } catch (error) {
        yield put({ type: actions.wallet.SEND_ASSET_ERROR, error: error })
        DropDownHolder.getDropDown().alertWithType('error', 'Send', 'Transaction sending failed')
    }
}

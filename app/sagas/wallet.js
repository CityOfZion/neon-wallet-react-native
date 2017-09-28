import { delay } from 'redux-saga'
import { put, takeEvery, call, all, takeLatest, select, fork, take, cancel, cancelled, race } from 'redux-saga/effects'
import { getWallet, getNetwork } from './selectors'
import {
    generateEncryptedWif,
    decrypt_wif,
    getBalance,
    getTransactionHistory,
    doSendAsset,
    getClaimAmounts,
    getWalletDBHeight
} from 'neon-js'

import { ActionConstants as actions } from '../actions'
import { DropDownHolder } from '../utils/DropDownHolder'
import { getMarketPriceUSD } from '../utils/walletStuff'

export function* rootWalletSaga() {
    yield all([watchCreateWallet(), watchLoginWallet(), watchSendAsset(), watchClaimGAS()])
}

/*
 *
 * Watchers 
 *
 */
function* watchCreateWallet() {
    yield takeEvery(actions.wallet.CREATE_WALLET, createWalletFlow)
}

function* watchLoginWallet() {
    while (true) {
        const params = yield take(actions.wallet.LOGIN)
        yield fork(walletUseFlow, params)

        const action = yield take([actions.wallet.LOGOUT, actions.wallet.LOGIN_ERROR])
        if (action.type == actions.wallet.LOGOUT) {
            yield put({ type: actions.wallet.RESET_STATE })
        }
    }
}

function* watchSendAsset() {
    yield takeEvery(actions.wallet.SEND_ASSET, sendAssetFlow)
}

function* watchClaimGAS() {
    yield takeEvery(actions.wallet.CLAIM_GAS, claimGASFlow)
}

/*
 *
 * action takers 
 *
 */
function* createWalletFlow(args) {
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

function* retrieveClaimAmount(network, address) {
    try {
        yield put({ type: actions.wallet.GET_AVAILABLE_GAS_CLAIM })
        const claimAmounts = yield call(getClaimAmounts, network, address)
        yield put({ type: actions.wallet.GET_AVAILABLE_GAS_CLAIM_SUCCESS, claimAmounts: claimAmounts })
        // perhaps disable button/functionality until next block update?
    } catch (error) {
        yield put({ type: actions.wallet.GET_AVAILABLE_GAS_CLAIM_ERROR, error: error })
    }
}

function* retrieveData() {
    const BLOCKCHAIN_UPDATE_INTERVAL = 15000
    // Note: keep `select`s inside while or we will miss network (TestNet<->MainNet) store changes
    const wallet = yield select(getWallet)
    const network = yield select(getNetwork)

    yield put({ type: actions.network.UPDATE_BLOCK_HEIGHT })
    const blockHeight = yield call(getWalletDBHeight, network.net)

    if (blockHeight > network.blockHeight[network.net]) {
        yield put({ type: actions.network.SET_BLOCK_HEIGHT, blockHeight: blockHeight })
        yield all([
            call(retrieveBalance, network.net, wallet.address),
            call(retrieveMarketPrice),
            call(retrieveTransactionHistory, network.net, wallet.address),
            call(retrieveClaimAmount, network.net, wallet.address)
        ])
    }
    yield call(delay, BLOCKCHAIN_UPDATE_INTERVAL)
}

function* backgroundSyncData() {
    const BLOCKCHAIN_UPDATE_INTERVAL = 15000
    try {
        yield put({ type: 'BACKGROUND_SYNC_STARTING' })
        while (true) {
            // either wait until the retrieveData task is finished or cancel that and update instantly if we see a network change
            yield race({
                updateTask: call(retrieveData),
                networkSwitch: take([actions.network.SWITCH, actions.network.TOGGLE])
            })
        }
    } finally {
        if (yield cancelled()) {
            yield put({ type: 'BACKGROUND_SYNC_STOPPED' })
        }
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

    // start periodic update of data from the blockchain
    const bgSync = yield fork(backgroundSyncData)

    // cancel when loging out of wallet
    yield take(actions.wallet.LOGOUT)
    yield cancel(bgSync)
}

function* sendAssetFlow(args) {
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
    } catch (error) {
        yield put({ type: actions.wallet.SEND_ASSET_ERROR, error: error })
        DropDownHolder.getDropDown().alertWithType('error', 'Send', 'Transaction sending failed')
    }
}

function* claimGASFlow() {
    // TODO: see https://github.com/CityOfZion/neon-wallet/blob/master/app/components/Claim.js
}

import { delay } from 'redux-saga'
import { put, takeEvery, call, all, takeLatest, select, fork, take, cancel, cancelled, race } from 'redux-saga/effects'
import { getWallet, getNetwork, getWalletGasBalance } from './selectors'
import { getBalance, getTransactionHistory, sendAsset, getClaimAmounts, getWalletDBHeight, doClaimAllGas } from '../api/network'
import { decryptWIF, generateEncryptedWIF } from '../api/crypto'

import { ActionConstants as actions } from '../actions'
import { DropDownHolder } from '../utils/DropDownHolder'
import { getMarketPriceUSD, isBlockedByTransportSecurityPolicy, generateEncryptedWif } from '../utils/walletStuff'

export function* rootWalletSaga() {
    yield all([watchCreateWallet(), watchLoginWallet(), watchSendAsset(), watchClaimGAS()])
}

/*
 *
 * Watchers 
 *
 */
export function* watchCreateWallet() {
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
export function* createWalletFlow(args) {
    const { passphrase, wif } = args
    try {
        yield put({ type: actions.wallet.CREATE_WALLET_START })
        yield call(delay, 1000) // to give the UI-thread time to show the 'generating view'

        const result = yield call(generateEncryptedWIF, passphrase, wif) // too computational heavy. Blocks Animations.
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
        yield call(delay, 1000) // to allow UI to update before it gets locked by the computational heavy decrypt_wif function
        const plainKey = yield call(decryptWIF, encryptedKey, passphrase)
        yield put({ type: actions.wallet.LOGIN_SUCCESS, plainKey })
    } catch (error) {
        yield put({ type: actions.wallet.LOGIN_ERROR, error: 'Wrong passphrase' })
        DropDownHolder.getDropDown().alertWithType('error', 'Error', 'Wrong passphrase')
    }
}

function* retrieveBalance(address) {
    try {
        yield put({ type: actions.wallet.GET_BALANCE })
        const balance = yield call(getBalance, address)
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

function* retrieveTransactionHistory(address) {
    try {
        yield put({ type: actions.wallet.GET_TRANSACTION_HISTORY })
        const transactions = yield call(getTransactionHistory, address)
        yield put({ type: actions.wallet.GET_TRANSACTION_HISTORY_SUCCESS, transactions: transactions })
    } catch (error) {
        yield put({ type: actions.wallet.GET_TRANSACTION_HISTORY_ERROR, error: error })
    }
}

function* retrieveClaimAmount(address) {
    try {
        yield put({ type: actions.wallet.GET_AVAILABLE_GAS_CLAIM })
        const claimAmounts = yield call(getClaimAmounts, address)
        yield put({ type: actions.wallet.GET_AVAILABLE_GAS_CLAIM_SUCCESS, claimAmounts: claimAmounts })
        // perhaps disable button/functionality until next block update?
    } catch (error) {
        yield put({ type: actions.wallet.GET_AVAILABLE_GAS_CLAIM_ERROR, error: error })
    }
}

function* retrieveData() {
    const BLOCKCHAIN_UPDATE_INTERVAL = 10000 //15000
    const wallet = yield select(getWallet)
    const network = yield select(getNetwork)

    yield put({ type: actions.network.UPDATE_BLOCK_HEIGHT })
    const blockHeight = yield call(getWalletDBHeight)

    if (blockHeight > network.blockHeight[network.net]) {
        yield put({ type: actions.network.SET_BLOCK_HEIGHT, blockHeight: blockHeight })
        yield all([
            call(retrieveBalance, wallet.address),
            call(retrieveMarketPrice),
            call(retrieveTransactionHistory, wallet.address),
            call(retrieveClaimAmount, wallet.address)
        ])
    }
    yield call(delay, BLOCKCHAIN_UPDATE_INTERVAL)
}

function* backgroundSyncData() {
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
    const FIVE_SECONDS = 5000

    try {
        yield call(sendAsset, toAddress, wallet.wif, assetType, amount)

        if (toAddress === wallet.address) {
            // Then we're just doing a transaction to release all "unspent_claim", so we can claim the GAS
            // and we don't want to notify the user with an additional dropdown box as we do below
            yield put({ type: actions.wallet.SEND_ASSET_SUCCESS, sentToSelf: true })
        } else {
            yield put({ type: actions.wallet.SEND_ASSET_SUCCESS, assetType, amount, sentToSelf: false })
            DropDownHolder.getDropDown().alertWithType(
                'success',
                'Success',
                'Transaction complete! Your balance will automatically update when the blockchain has processed it.'
            )
            // SEND_ASSET_SUCCESS sets a variable that tells the walletInfo/SendAssetForm components to update some parts
            // We want to reset that variable here
            yield call(delay, FIVE_SECONDS)
            yield put({ type: actions.wallet.SEND_ASSET_RESET_SEND_INDICATORS })
        }
    } catch (error) {
        const { blockedByPolicy, blockedDomain } = isBlockedByTransportSecurityPolicy(error)
        if (blockedByPolicy) {
            DropDownHolder.getDropDown().alertWithType(
                'error',
                'Error',
                'Transaction sending failed.' +
                    `${blockedDomain}` +
                    ' not allowed by iOS App Transport Security policy. Please contact the wallet author.'
            )
        } else {
            DropDownHolder.getDropDown().alertWithType('error', 'Send', 'Transaction sending failed')
        }
        yield put({ type: actions.wallet.SEND_ASSET_ERROR, error: error })
    }
}

function* claim(wif) {
    // doClaimAllGas example usage
    // https://github.com/CityOfZion/neon-wallet/blob/1d0d037ae5813c0e04af4a196053923d8c0cfe57/app/components/Claim.js#L13
    // https://github.com/CityOfZion/neon-js/blob/ec8ba51a4fb8dea3c9f777db002b9c2e5c8a8ad0/src/api.js#L45
    try {
        yield put({ type: actions.wallet.CLAIM_GAS_START })
        const response = yield call(doClaimAllGas, wif)
        if (response.result == true) {
            yield put({ type: actions.wallet.CLAIM_GAS_SUCCESS })
        } else {
            yield put({ type: actions.wallet.CLAIM_GAS_ERROR, error: 'Claim failed' })
        }
    } catch (error) {
        yield put({ type: actions.wallet.CLAIM_GAS_ERROR, error: error })
    }
}

function* waitForTransactionToSelfToClear() {
    yield put({ type: actions.wallet.WAITING_FOR_TRANSACTION_TO_SELF_TO_CLEAR })

    while (true) {
        yield take(actions.wallet.GET_AVAILABLE_GAS_CLAIM_SUCCESS)
        let wallet = yield select(getWallet)
        if (wallet.claimUnspend == 0) {
            // confirmed
            yield put({ type: actions.wallet.TRANSACTION_TO_SELF_CLEARED })
            break
        }
    }
}

function* claimGASFlow() {
    const wallet = yield select(getWallet)

    /* If we have NEO balance in our wallet, then part or all of the available claim can be "unspent_claim".
     * We first have to release this. This can be done by sending to yourself. Read about it here:
     * https://github.com/CityOfZion/neon-wallet-db#claiming-gas
     * https://github.com/CityOfZion/neon-wallet-db/blob/master/docs/Overview.md#what-is-the-difference-between-an-available-and-unavailable-claim
     */
    if (wallet.neo != 0) {
        yield put({ type: actions.wallet.UNSPEND_CLAIM_TO_CLEAR }) // we can just assume this based on Neo balance instead of checking with `retrieveClaimAmount`

        const sendToSelfParams = { assetType: 'Neo', toAddress: wallet.address, amount: wallet.neo }
        yield call(sendAssetFlow, sendToSelfParams)
        yield fork(waitForTransactionToSelfToClear)

        yield take(actions.wallet.TRANSACTION_TO_SELF_CLEARED)
    }
    yield call(claim, wallet.wif)

    // Wait for GAS balance to be confirmed
    const oldGASBalance = wallet.gas
    while (true) {
        let newGASBalance = yield select(getWalletGasBalance)
        if (newGASBalance > oldGASBalance) {
            // This sitation might occur for 2 reasons:
            // 1) GAS balance has updated as the result of our claim being confirmed by the blockchain
            // 2) Somebody happened to have sent us GAS in the time window between the CLAIM_GAS_SUCCESS and the next ~2 GET_BALANCE_SUCCESS events
            // Option 2 is so unlikely to happen that I consider this an acceptable solution
            yield put({ type: actions.wallet.CLAIM_GAS_CONFIRMED_BY_BLOCKCHAIN })
            return
        } else {
            yield take(actions.wallet.GET_BALANCE_SUCCESS)
        }
    }
}

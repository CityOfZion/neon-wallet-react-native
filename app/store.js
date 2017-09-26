// Redux
import { applyMiddleware, combineReducers, createStore, compose } from 'redux'
import { persistStore, autoRehydrate } from 'redux-persist'
import { createLogger } from 'redux-logger'
import reducer from './reducers'
import { AsyncStorage } from 'react-native'

import createSagaMiddleware from 'redux-saga'
import rootSaga from './sagas'

// Middleware
const loggerMiddleware = createLogger({
    predicate: (getState, action) => __DEV__,
    diff: true
})

const sagaMiddleWare = createSagaMiddleware()

const middleware = () => {
    return applyMiddleware(sagaMiddleWare, loggerMiddleware)
}

let initialState = {
    wallet: {
        wif: null,
        address: null,
        passphrase: null,
        encryptedWif: null,
        generating: false,
        saved_keys: {}, // key: name
        decrypting: false,
        loggedIn: false,
        logInError: null,
        neo: 0,
        gas: 0,
        price: 0.0,
        transactions: [],
        claimAmount: 0
    },
    network: {
        net: 'TestNet',
        blockHeight: {
            TestNet: 0,
            MainNet: 0
        }
    }
}

const store = createStore(reducer, initialState, middleware())
// https://github.com/rt2zz/redux-persist/issues/126   store overwritting might be solved like this
// const store = createStore(reducer, initialState, compose(middleware(), autoRehydrate()))

// persistStore(store, { storage: AsyncStorage })

sagaMiddleWare.run(rootSaga)

export default store

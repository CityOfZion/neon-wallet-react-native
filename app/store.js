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

let initialState = {}

const store = createStore(reducer, initialState, middleware())
// https://github.com/rt2zz/redux-persist/issues/126   store overwritting might be solved like this
// const store = createStore(reducer, initialState, compose(middleware(), autoRehydrate()))

// persistStore(store, { storage: AsyncStorage })

sagaMiddleWare.run(rootSaga)

export default store

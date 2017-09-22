import { all } from 'redux-saga/effects'
import { rootWalletSaga } from './wallet'

export default function* rootSaga() {
    yield all([rootWalletSaga()])
}

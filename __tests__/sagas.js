import { call, take, put } from 'redux-saga/effects'
import SagaTester from 'redux-saga-tester'
import { mockSaga } from 'redux-saga-mock'
import { watchCreateWallet, createWalletFlow } from '../app/sagas/wallet'
import { ActionConstants as actionMsg } from '../app/actions'
import { ActionCreators as actions } from '../app/actions'
import { generateEncryptedWIF } from '../app/api/crypto'
import reducer from '../app/reducers'
import { initialState } from '../app/store'
import { DropDownHolder } from '../app/utils/DropDownHolder'

// use official test vectors from https://github.com/neo-project/proposals/blob/master/nep-2.mediawiki#test-vectors
const unencryptedWIF = 'L44B5gGEpqEDRS9vVPz7QT35jcBG2r3CZwSwQ4fCewXAhAhqGVpP'
const passphrase = 'TestingOneTwoThree'
const encryptedWIF = '6PYVPVe1fQznphjbUxXP9KZJqPMVnVwCx5s5pr5axRJ8uHkMtZg97eT5kL'
const publicAddress = 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt'

describe('wallet creation', () => {
    describe('watcher', () => {
        it('should accept any create action', () => {
            const sagaTester = new SagaTester({
                initialState: {}
            }) // not using any initial state
            const testSaga = mockSaga(watchCreateWallet)

            // setup
            testSaga.stubFork(createWalletFlow, () => {
                sagaTester.dispatch({ type: actionMsg.wallet.CREATE_WALLET_START })
            })
            sagaTester.start(testSaga)

            // interact
            sagaTester.dispatch({ type: actionMsg.wallet.CREATE_WALLET })
            expect(sagaTester.numCalled(actionMsg.wallet.CREATE_WALLET_START)).toEqual(1)
            sagaTester.dispatch({ type: actionMsg.wallet.CREATE_WALLET })
            expect(sagaTester.numCalled(actionMsg.wallet.CREATE_WALLET_START)).toEqual(2)
        })
    })

    describe('create flow', () => {
        let sagaTester
        let testSaga

        beforeEach(() => {
            sagaTester = new SagaTester({
                initialState: initialState,
                reducers: reducer
            })
            testSaga = mockSaga(watchCreateWallet)

            return { sagaTester, testSaga }
        })

        it('should generate a valid encrypted WIF from only a passphrase', async () => {
            // case specific setup
            sagaTester.start(testSaga)
            sagaTester.dispatch(actions.wallet.create(passphrase))

            // must use async + await if the saga has a 'delay' call or we'll miss data i.e. missing actions in sagaTester.getLatestCalledAction()
            await sagaTester.waitFor(actionMsg.wallet.CREATE_WALLET_SUCCESS)
            const walletState = sagaTester.getState().wallet
            expect(walletState.wif).toHaveLength(52)
            expect(walletState.address).toHaveLength(34)
            expect(walletState.encryptedWIF).toHaveLength(58)
        })

        it('should generate a deterministic and valid encrypted WIF from a passphrase and valid unencrypted WIF', async () => {
            // case specific setup
            sagaTester.start(testSaga)
            sagaTester.dispatch(actions.wallet.create(passphrase, unencryptedWIF))

            await sagaTester.waitFor(actionMsg.wallet.CREATE_WALLET_SUCCESS)
            const walletState = sagaTester.getState().wallet
            expect(walletState.wif).toHaveLength(52)
            expect(walletState.encryptedWIF).toEqual(encryptedWIF)
        })

        it('should log an error when attempting to encrypt an invalid WIF', async () => {
            // case specific setup
            // 'mock' our DropDownHolder to avoid reference errors.
            let placeHolder = {}
            placeHolder.alertWithType = () => {}
            DropDownHolder.setDropDown(placeHolder)

            // let's go!
            sagaTester.start(testSaga)
            const invalidWIF = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
            sagaTester.dispatch(actions.wallet.create(passphrase, invalidWIF))

            await sagaTester.waitFor(actionMsg.wallet.CREATE_WALLET_ERROR)
            expect(sagaTester.numCalled(actionMsg.wallet.CREATE_WALLET_ERROR)).toEqual(1)
            expect(sagaTester.getLatestCalledAction().error.message).toBe('Invalid WIF')
        })
    })
})

import { call, take, put } from 'redux-saga/effects'
import SagaTester from 'redux-saga-tester'
import { mockSaga } from 'redux-saga-mock'
import { watchCreateWallet, createWalletFlow, watchLoginWallet, walletUseFlow, backgroundSyncData, retrieveData } from '../app/sagas/wallet'
import { ActionConstants as actionMsg } from '../app/actions'
import { ActionCreators as actions } from '../app/actions'
import { generateEncryptedWIF } from '../app/api/crypto'
import reducer from '../app/reducers'
import { initialState } from '../app/store'
import { DropDownHolder } from '../app/utils/DropDownHolder'
import nock from 'nock'
import 'isomorphic-fetch'

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

    describe('flow', () => {
        let sagaTester
        let testSaga

        beforeEach(() => {
            sagaTester = new SagaTester({
                initialState: initialState,
                reducers: reducer
            })
            testSaga = mockSaga(watchCreateWallet)
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

describe('wallet use', () => {
    describe('watcher', () => {
        let sagaTester
        let testSaga

        beforeEach(() => {
            sagaTester = new SagaTester({
                initialState: initialState,
                reducers: reducer
            })
            testSaga = mockSaga(watchLoginWallet)
        })

        it('should accept just 1 login at a time', () => {
            // case specific setup
            testSaga.stubFork(walletUseFlow, () => {
                sagaTester.dispatch({ type: 'USE_FLOW_STARTED' })
            })
            sagaTester.start(testSaga)

            // interact
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            expect(sagaTester.numCalled('USE_FLOW_STARTED')).toEqual(1)
        })

        it('should allow another login after a failed login attempt', async () => {
            // case specific setup
            testSaga.stubFork(walletUseFlow, () => {
                sagaTester.dispatch({ type: 'USE_FLOW_STARTED' })
                sagaTester.dispatch({ type: actionMsg.wallet.LOGIN_ERROR })
            })
            sagaTester.start(testSaga)

            // interact
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            await sagaTester.waitFor(actionMsg.wallet.LOGIN_ERROR)
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            expect(sagaTester.numCalled('USE_FLOW_STARTED')).toEqual(2)
        })

        it('should allow logging in after having logged out', async () => {
            // case specific setup
            testSaga.stubFork(walletUseFlow, () => {
                sagaTester.dispatch({ type: 'USE_FLOW_STARTED' })
                sagaTester.dispatch({ type: actionMsg.wallet.LOGOUT })
            })
            sagaTester.start(testSaga)

            // interact
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            await sagaTester.waitFor(actionMsg.wallet.LOGOUT)
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            expect(sagaTester.numCalled('USE_FLOW_STARTED')).toEqual(2)
        })

        it('should reset the store state when logging out', async () => {
            testSaga.stubFork(walletUseFlow, () => {
                // set dummy store values
                let state = sagaTester.getState()
                state.claim.unspendToClear = true
                state.wallet.wif = unencryptedWIF
                state.network.blockHeight.TestNet = 123
                sagaTester.setState(state)

                sagaTester.dispatch({ type: actionMsg.wallet.LOGOUT })
            })
            sagaTester.start(testSaga)

            // interact
            sagaTester.dispatch({ type: actionMsg.wallet.LOGIN })
            await sagaTester.waitFor(actionMsg.wallet.RESET_STATE)
            let newState = sagaTester.getState()
            expect(newState.claim.unspendToClear).toBe(false)
            expect(newState.wallet.wif).toBe(null)
            expect(newState.network.blockHeight.TestNet).toBe(0)
        })
    })

    describe('flow', () => {
        let sagaTester
        let testSaga

        beforeEach(() => {
            sagaTester = new SagaTester({
                initialState: initialState,
                reducers: reducer
            })
            testSaga = mockSaga(watchLoginWallet)
        })

        it('should first decrypt the wallet key if an encrypted key is provided', async () => {
            testSaga.stubFork(backgroundSyncData, async () => {
                sagaTester.dispatch({ type: 'TEST_BG_TASK_STARTED' })
            })

            sagaTester.start(testSaga)
            sagaTester.dispatch(actions.wallet.login(passphrase, encryptedWIF))
            await sagaTester.waitFor(actionMsg.wallet.LOGIN_SUCCESS)

            // verify store is filled correctly
            const walletState = sagaTester.getState().wallet
            expect(walletState.wif).toHaveLength(52)
            expect(walletState.address).toHaveLength(34)
            expect(walletState.wif).toEqual(unencryptedWIF)
            expect(walletState.loggedIn).toBe(true)
        })

        it('should throw an error if the passphrase is wrong', async () => {
            // case specific setup
            // 'mock' our DropDownHolder to avoid reference errors.
            let placeHolder = {}
            placeHolder.alertWithType = () => {}
            DropDownHolder.setDropDown(placeHolder)

            testSaga.stubFork(backgroundSyncData, async () => {
                sagaTester.dispatch({ type: 'TEST_BG_TASK_STARTED' })
            })

            sagaTester.start(testSaga)
            sagaTester.dispatch(actions.wallet.login('fakepassphrase', encryptedWIF))
            await sagaTester.waitFor(actionMsg.wallet.LOGIN_ERROR)
            expect(sagaTester.getLatestCalledAction().error.message).toBe('Wrong passphrase!')
        })

        it('should start a background task fetching data from the network if logged in successfully', async () => {
            testSaga.stubFork(backgroundSyncData, async () => {
                sagaTester.dispatch({ type: 'TEST_BG_TASK_STARTED' })
            })

            sagaTester.start(testSaga)
            sagaTester.dispatch(actions.wallet.loginWithPrivateKey(unencryptedWIF))
            await sagaTester.waitFor(actionMsg.wallet.LOGIN_SUCCESS)

            expect(sagaTester.numCalled('TEST_BG_TASK_STARTED')).toBe(1)
        })

        it('should cancel the background task when logging out', async () => {
            function* blockHeightGenerator() {
                var index = 1;
                while(true)
                  yield index++;
              }

            var blockGen = blockHeightGenerator()

            nock('http://testnet-api.wallet.cityofzion.io')
                .get('/v2/block/height')
                .reply(200, {
                    block_height: blockGen.next().value,
                    net: 'TestNet'
                })

            nock('http://testnet-api.wallet.cityofzion.io')
                .get('/v2/block/height')
                .reply(200, {
                    block_height: blockGen.next().value,
                    net: 'TestNet'
                })

            nock('http://testnet-api.wallet.cityofzion.io')
                .get('/v2/block/height')
                .reply(200, {
                    block_height: blockGen.next().value,
                    net: 'TestNet'
                })

            nock('http://testnet-api.wallet.cityofzion.io')
                .persist()
                .filteringPath(function(path) {
                    if (path.includes('/v2/address/balance/')) {
                        return '/v2/address/balance/'
                    } else {
                        return path
                    }
                })
                .get('/v2/address/balance/')
                .reply(200, {
                    GAS: {
                        balance: 0,
                        unspent: []
                    },
                    NEO: {
                        balance: 0,
                        unspent: []
                    },
                    address: 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt',
                    net: 'TestNet'
                })

            nock('http://testnet-api.wallet.cityofzion.io')
                .persist()
                .filteringPath(function(path) {
                    if (path.includes('/v2/address/history/')) {
                        return '/v2/address/history/'
                    } else {
                        return path
                    }
                })
                .get('/v2/address/history/')
                .reply(200, {
                    address: 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt',
                    history: [],
                    name: 'transaction_history',
                    net: 'TestNet'
                })

            nock('http://testnet-api.wallet.cityofzion.io')
                .persist()
                .filteringPath(function(path) {
                    if (path.includes('/v2/address/claims/')) {
                        return '/v2/address/claims/'
                    } else {
                        return path
                    }
                })
                .get('/v2/address/claims/')
                .reply(200, {
                    address: 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt',
                    claims: [],
                    net: 'TestNet',
                    total_claim: 0,
                    total_unspent_claim: 0
                })

            nock('https://bittrex.com')
                .persist()
                .get('/api/v1.1/public/getticker?market=USDT-NEO')
                .reply(200, {
                    success: true,
                    message: '',
                    result: { Bid: 1337.00000001, Ask: 1337.00000002, Last: 1337.00000003 }
                })

            let task = sagaTester.start(testSaga)
            sagaTester.dispatch(actions.wallet.loginWithPrivateKey(unencryptedWIF))
            await sagaTester.waitFor(actionMsg.network.UPDATE_BLOCK_HEIGHT, true)
            await sagaTester.waitFor(actionMsg.network.UPDATE_BLOCK_HEIGHT, true)
            sagaTester.dispatch({type:actionMsg.wallet.LOGOUT})

            expect(testSaga.query().putAction('JEST_BG_TASK_CANCELLED').isPresent).toBe(true)
        })
    })
})

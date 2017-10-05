import * as walletActions from './wallet'
import * as networkActions from './network'
import * as settingsActions from './settings'

export const ActionCreators = Object.assign({}, { wallet: walletActions, network: networkActions, settings: settingsActions })

export const ActionConstants = Object.assign(
    {},
    { wallet: walletActions.constants, network: networkActions.constants, settings: settingsActions.constants }
)

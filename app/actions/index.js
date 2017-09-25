import * as walletActions from './wallet'
import * as networkActions from './network'

export const ActionCreators = Object.assign({}, { wallet: walletActions })

export const ActionConstants = Object.assign({}, { wallet: walletActions.constants, network: networkActions.constants })

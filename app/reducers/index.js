import { combineReducers } from 'redux'
import navigation from './navigation'
import wallet from './wallet'
import network from './network'
import claim from './claim'
import settings from './settings'

export default combineReducers({ rootStackNav: navigation, wallet: wallet, network: network, claim: claim, settings: settings })

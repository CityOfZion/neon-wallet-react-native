import { combineReducers } from 'redux'
import navigation from './navigation'
import wallet from './wallet'
import network from './network'
import claim from './claim'

export default combineReducers({ rootStackNav: navigation, wallet: wallet, network: network, claim: claim })

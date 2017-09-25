import { combineReducers } from 'redux'
import navigation from './navigation'
import wallet from './wallet'
import network from './network'

export default combineReducers({ rootStackNav: navigation, wallet: wallet, network: network })

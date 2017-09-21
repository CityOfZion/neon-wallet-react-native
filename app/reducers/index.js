import { combineReducers } from 'redux'
import navigation from './navigation'
import wallet from './wallet'

export default combineReducers({ rootStackNav: navigation, wallet: wallet })

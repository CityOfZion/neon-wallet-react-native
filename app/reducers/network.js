import { ActionConstants as actions } from '../actions'
import { NETWORK_MAIN, NETWORK_TEST } from '../actions/network'

export default function network(state = {}, action) {
    switch (action.type) {
        case actions.network.SWITCH: {
            return {
                ...state,
                net: action.network
            }
        }
        default:
            return state
    }
}

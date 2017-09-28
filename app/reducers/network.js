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
        case actions.network.SET_BLOCK_HEIGHT: {
            const newBlockHeight = {
                ...state.blockHeight,
                [state.net]: action.blockHeight
            }
            return {
                ...state,
                blockHeight: newBlockHeight
            }
        }
        case actions.network.TOGGLE: {
            return {
                ...state,
                net: state.net === NETWORK_MAIN ? NETWORK_TEST : NETWORK_MAIN
            }
        }
        default:
            return state
    }
}

import { ActionConstants as actions } from '../actions'

export default function settings(state = {}, action) {
    switch (action.type) {
        case actions.settings.SAVE_KEY:
            let newKeys = {
                ...state.saved_keys,
                [action.key]: action.name
            }
            return {
                ...state,
                saved_keys: newKeys
            }
        case actions.settings.DELETE_KEY:
            let tmpSavedKeys = state.saved_keys
            delete tmpSavedKeys[action.key]
            return {
                ...state,
                saved_keys: tmpSavedKeys
            }
        default:
            return state
    }
}

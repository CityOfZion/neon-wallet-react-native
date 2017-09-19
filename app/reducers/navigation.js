import { RootStackNavigator } from '../navigators/RootNavigationConfiguration'
import { NavigationActions, StateUtils } from 'react-navigation'

export default function navigation(state, action) {
    switch (action.type) {
        // case 'JUMP_TO_TAB':
        //     return { ...state, ...action.payload }
        default:
            newState = RootStackNavigator.router.getStateForAction(action, state)
            return newState ? newState : state
    }
}

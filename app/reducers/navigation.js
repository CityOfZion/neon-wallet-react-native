import { RootStackNavigator } from '../navigators/RootNavigationConfiguration'
import { NavigationActions, StateUtils } from 'react-navigation'

export default function navigation(state, action) {
    switch (action.type) {
        default:
            var newState = RootStackNavigator.router.getStateForAction(action, state)
            return newState ? newState : state
    }
}

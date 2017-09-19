import React from 'react'
import { AppRegistry, View } from 'react-native'
import { Provider } from 'react-redux'
import store from './store'
import RootStackNavigation from './navigators/RootStackNavigation'
import DropdownAlert from 'react-native-dropdownalert'
import { DropDownHolder } from './utils/DropDownHolder'

class App extends React.Component {
    render() {
        console.ignoredYellowBox = ['Remote debugger']
        return (
            <Provider store={store}>
                <View style={{ width: '100%', height: '100%' }}>
                    <RootStackNavigation />
                    <DropdownAlert ref={ref => DropDownHolder.setDropDown(ref)} />
                </View>
            </Provider>
        )
    }
}

AppRegistry.registerComponent('neonwallet', () => App)

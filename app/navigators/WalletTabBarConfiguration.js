import React from 'react'
import { TabNavigator, TabBarBottom } from 'react-navigation'
import FAIcons from 'react-native-vector-icons/FontAwesome'
import ENTIcons from 'react-native-vector-icons/Entypo'

//Entypo wallet

import WalletInfo from '../screens/loggedIn/walletInfo'
import TransactionHistory from '../screens/loggedIn/transactionHistory'

const routeConfiguration = {
    WalletInfo: {
        screen: WalletInfo,
        // screen: GiveFeedbackNavigation,
        navigationOptions: {
            tabBarLabel: 'Wallet',
            tabBarIcon: ({ tintColor, focused }) => <ENTIcons name={'wallet'} size={24} style={{ color: tintColor }} />
        }
    },
    TransactionHistory: {
        screen: TransactionHistory,
        navigationOptions: {
            tabBarLabel: 'Transaction history',
            tabBarIcon: ({ tintColor, focused }) => <FAIcons name="history" size={24} style={{ color: tintColor }} />
        }
    }
}

const tabBarConfiguration = {
    // other configs
    tabBarOptions: {
        activeBackgroundColor: 'white',
        inactiveBackgroundColor: 'white',
        activeTintColor: '#4D933B', // label and icon color of the active tab
        inactiveTintColor: '#979797', // label and icon color of the inactive tab
        labelStyle: {
            // style object for the labels on the tabbar
            fontSize: 12,
            color: '#636363'
        },
        style: {
            // style object for the tabbar itself
            borderTopColor: '#979797', // seems to set the tabbar top border color on IOS
            borderTopWidth: 1 // although it looked like one, the color didn't seem to match the nav bar color without this setting
        }
    },
    tabBarComponent: TabBarBottom,
    tabBarPosition: 'bottom'
}

export const WalletTabBar = TabNavigator(routeConfiguration, tabBarConfiguration)

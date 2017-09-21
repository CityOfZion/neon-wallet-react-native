import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import Tile from '../components/Tile'

class Home extends React.Component {
    _goToScreen(screenName) {
        this.props.navigation.navigate(screenName)
    }

    render() {
        return (
            <View style={styles.main}>
                <Image style={styles.logo} source={require('../images/neon-logo2.png')} resizeMode="contain" />
                <View style={styles.tiles}>
                    <Tile title="Create a new wallet" dark onPress={() => this._goToScreen('CreateWallet')} />
                    <Tile title="Login using a saved wallet" onPress={() => this._goToScreen('LoginWallet')} />
                    <Tile title="Encrypt an existing key" dark />
                    <Tile title="Login using an encrypted key" />
                    <Tile title="Manage neon settings" dark />
                    <Tile
                        title="Login using a private key"
                        onPress={() => this.props.navigation.dispatch({ type: 'WALLET/LOGIN_SUCCESS' })}
                    />
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    main: {
        flex: 1,
        marginTop: 20,
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    tiles: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10
    },
    logo: {
        width: 110,
        height: 30,
        marginLeft: 15
    }
})

export default Home

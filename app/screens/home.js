import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import Tile from '../components/Tile'

class Home extends React.Component {
    _goToScreen(screenName, payload) {
        this.props.navigation.navigate(screenName, payload)
    }

    render() {
        return (
            <View style={styles.main}>
                <Image style={styles.logo} source={require('../images/neon-logo2.png')} resizeMode="contain" />
                <View style={styles.tiles}>
                    <Tile title="Create a new wallet" dark onPress={() => this._goToScreen('CreateWallet', { useExistingKey: false })} />
                    <Tile title="Login using a saved wallet" onPress={() => this._goToScreen('LoginWallet')} />
                    <Tile title="Encrypt an existing key" dark onPress={() => this._goToScreen('CreateWallet', { useExistingKey: true })} />
                    <Tile title="Login using an encrypted key" onPress={() => this._goToScreen('LoginWithEncryptedKey')} />
                    <Tile title="Manage neon settings" dark onPress={() => alert('Not yet implemented')} />
                    <Tile title="Login using a private key" onPress={() => this._goToScreen('LoginWithPrivateKey')} />
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

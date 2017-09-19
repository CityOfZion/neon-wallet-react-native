import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import Tile from '../components/Tile'

class Home extends React.Component {
    _createNewWallet() {
        console.log('creating new wallet')
        this.props.navigation.navigate('CreateWallet')
    }

    render() {
        return (
            <View style={styles.main}>
                <Image style={styles.logo} source={require('../images/neon-logo2.png')} resizeMode="contain" />
                <View style={styles.tiles}>
                    <Tile title="Create a new wallet" dark onPress={this._createNewWallet.bind(this)} />
                    <Tile title="Login using a saved wallet" />
                    <Tile title="Encrypt an existing key" dark />
                    <Tile title="Login using an encrypted key" />
                    <Tile title="Manage neon settings" dark />
                    <Tile title="Login using a private key" />
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

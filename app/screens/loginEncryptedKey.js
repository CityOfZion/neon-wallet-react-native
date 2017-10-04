import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import ModalDropdown from 'react-native-modal-dropdown'
import Button from '../components/Button'

// redux
import { bindActionCreatorsExt } from '../utils/bindActionCreatorsExt'
import { connect } from 'react-redux'
import { ActionCreators } from '../actions'

class LoginEncryptedKey extends React.Component {
    _walletLogin() {
        let passphrase = this.txtPassphrase._lastNativeText
        let encryptedKey = this.txtEncryptedKey._lastNativeText
        this.props.wallet.login(passphrase, encryptedKey)
    }

    _renderBarIndicator() {
        // don't use until key generation duration becomes less than 1/60 or it will block the animation
        // <View style={{ flexDirection: 'row' }}>
        //     <BarIndicator color="#236312" count={5} />
        // </View>
        return (
            <View style={styles.indicatorView}>
                <Text style={styles.indicatorText}>Decrypting keys...</Text>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                <View style={styles.loginForm}>
                    <TextInput
                        ref={txtInput => {
                            this.txtPassphrase = txtInput
                        }}
                        multiline={false}
                        placeholder="Enter passphrase here"
                        placeholderTextColor="#636363"
                        returnKeyType="done"
                        style={styles.inputBox}
                        autoCorrect={false}
                        secureTextEntry={true}
                    />
                    <TextInput
                        ref={txtInput => {
                            this.txtEncryptedKey = txtInput
                        }}
                        multiline={false}
                        placeholder="Enter your encrypted key here"
                        placeholderTextColor="#636363"
                        returnKeyType="done"
                        style={styles.inputBox}
                        autoCorrect={false}
                        secureTextEntry={true}
                    />
                    <Button title="Login" onPress={this._walletLogin.bind(this)} />
                </View>
                {this.props.decrypting ? this._renderBarIndicator() : null}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    inputBox: {
        marginHorizontal: 20,
        marginVertical: 5,
        paddingLeft: 10,
        height: 36,
        fontSize: 14,
        backgroundColor: '#E8F4E5',
        color: '#333333'
    },
    loginForm: {
        marginTop: 5
    },
    indicatorView: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#AAAAAA66'
    },
    indicatorText: {
        fontSize: 18,
        color: '#333',
        fontWeight: 'bold'
    }
})

function mapStateToProps(state, ownProps) {
    return {
        decrypting: state.wallet.decrypting
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginEncryptedKey)

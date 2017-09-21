import React from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import { DropDownHolder } from '../utils/DropDownHolder'
import Button from '../components/Button'
import KeyDataRow from '../components/KeyDataRow'
import GeneratedKeysView from '../components/GeneratedKeysView'
import { resetState } from '../actions/wallet'

import { BarIndicator } from 'react-native-indicators'

// redux
import { bindActionCreatorsExt } from '../utils/bindActionCreatorsExt'
import { connect } from 'react-redux'
import { ActionCreators } from '../actions'

class CreateWallet extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        headerLeftOnPress: () => {
            // requires https://github.com/react-community/react-navigation/pull/1291
            navigation.dispatch(resetState())
            navigation.goBack()
        }
    })

    constructor(props) {
        super(props)
        this.dropdown = DropDownHolder.getDropDown()
    }

    _generateKeys() {
        if (this._isValidInput()) {
            const current_phrase = this.txtInput1._lastNativeText
            this.props.wallet.createWallet(current_phrase)
        }
    }

    _isValidInput() {
        // test if input contains content
        var result = false
        if (this.txtInput1._lastNativeText && this.txtInput2._lastNativeText) {
            if (this.txtInput1._lastNativeText.length < 5) {
                this.dropdown.alertWithType('error', 'Error', 'Passphrase too short. Minimal 5 characters.')
            } else if (this.txtInput1._lastNativeText != this.txtInput2._lastNativeText) {
                this.dropdown.alertWithType('error', 'Error', 'Passphrases do not match')
            } else {
                result = true
            }
        } else {
            this.dropdown.alertWithType('error', 'Error', 'Passphrases cannot be empty')
        }
        return result
    }

    _renderPassphraseEntry() {
        return (
            <View style={{ marginTop: 20 }}>
                <Text style={styles.instructionText}>Choose a passphrase to encrypt your private key</Text>
                <TextInput
                    ref={txtInput => {
                        this.txtInput1 = txtInput
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
                        this.txtInput2 = txtInput
                    }}
                    multiline={false}
                    placeholder="Repeat passphrase here"
                    placeholderTextColor="#636363"
                    returnKeyType="done"
                    style={styles.inputBox}
                    autoCorrect={false}
                    secureTextEntry={true}
                />
                <Button onPress={this._generateKeys.bind(this)} title="Generate keys" />
            </View>
        )
    }

    _renderBarIndicator() {
        // don't use until key generation duration becomes less than 1/60 or it will block the animation
        // <View style={{ flexDirection: 'row' }}>
        //     <BarIndicator color="#236312" count={5} />
        // </View>
        return (
            <View style={styles.indicatorView}>
                <Text style={styles.indicatorText}>Generating...</Text>
            </View>
        )
    }

    _saveKey(key_name) {
        this.props.wallet.saveKey(this.props.encryptedWif, key_name)
    }

    render() {
        const { generating, wif, passphrase, address, encryptedWif } = this.props
        return (
            <View style={styles.main}>
                {wif == null ? this._renderPassphraseEntry() : null}
                {generating ? this._renderBarIndicator() : null}
                {!generating && wif != null ? (
                    <GeneratedKeysView
                        wif={wif}
                        passphrase={passphrase}
                        address={address}
                        encryptedWif={encryptedWif}
                        saveKeyCallback={this._saveKey.bind(this)}
                    />
                ) : null}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    main: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-start'
    },
    instructionText: {
        color: '#333333',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10
    },
    inputBox: {
        marginHorizontal: 20,
        marginVertical: 5,
        paddingLeft: 10,
        height: 30,
        fontSize: 14,
        backgroundColor: '#E8F4E5',
        color: '#333333'
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
        wif: state.wallet.wif,
        address: state.wallet.address,
        passphrase: state.wallet.passphrase,
        encryptedWif: state.wallet.encryptedWif,
        generating: state.wallet.generating
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet)

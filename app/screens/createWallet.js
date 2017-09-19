import React from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { DropDownHolder } from '../utils/DropDownHolder'

// redux
import { bindActionCreatorsExt } from '../utils/bindActionCreatorsExt'
import { connect } from 'react-redux'
import { ActionCreators } from '../actions'

class Home extends React.Component {
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
        result = false
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

    render() {
        return (
            <View style={styles.main}>
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
                <TouchableOpacity onPress={this._generateKeys.bind(this)} style={styles.button}>
                    <Text style={styles.buttonText}>Generate keys</Text>
                </TouchableOpacity>
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
        // paddingTop: 5,
        height: 40,
        fontSize: 14,
        backgroundColor: '#E8F4E5',
        color: '#333333'
    },
    button: {
        backgroundColor: '#4D933B',
        marginHorizontal: 20,
        height: 40,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 14
    }
})

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}
export default connect(null, mapDispatchToProps)(Home)

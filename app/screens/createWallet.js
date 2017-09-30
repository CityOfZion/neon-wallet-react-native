import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import Button from '../components/Button'
import GeneratedKeysView from '../components/GeneratedKeysView'
import { isValidWIF, isValidPassphrase } from '../utils/walletStuff'
import { DropDownHolder } from '../utils/DropDownHolder'
import { resetState } from '../actions/wallet'

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
        this.state = {
            useExistingKey: false
        }
    }

    componentDidMount() {
        this.setState({ useExistingKey: this.props.navigation.state.params.useExistingKey })
    }

    _generateKeys() {
        const pw1 = this.txtPassphrase._lastNativeText
        const pw2 = this.txtPassphraseRepeat._lastNativeText
        const wif = this.txtPrivateKey && this.txtPrivateKey._lastNativeText

        if (isValidPassphrase(pw1, pw2)) {
            if (this.state.useExistingKey) {
                if (isValidWIF(wif)) {
                    this.props.wallet.create(pw1, wif)
                }
            } else {
                this.props.wallet.create(pw1)
            }
        }
    }

    _renderWIFEntry() {
        return (
            <TextInput
                ref={txtInput => {
                    this.txtPrivateKey = txtInput
                }}
                multiline={false}
                placeholder="Enter your private key (WIF) here"
                placeholderTextColor="#636363"
                returnKeyType="done"
                style={styles.inputBox}
                autoCorrect={false}
                secureTextEntry={true}
            />
        )
    }

    _renderPassphraseEntry() {
        return (
            <View style={styles.container}>
                <View style={styles.generateForm}>
                    <Text style={styles.instructionText}>Choose a passphrase to encrypt your private key</Text>
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
                            this.txtPassphraseRepeat = txtInput
                        }}
                        multiline={false}
                        placeholder="Repeat passphrase here"
                        placeholderTextColor="#636363"
                        returnKeyType="done"
                        style={styles.inputBox}
                        autoCorrect={false}
                        secureTextEntry={true}
                    />
                    {this.state.useExistingKey ? this._renderWIFEntry() : null}
                    <Button onPress={this._generateKeys.bind(this)} title="Generate encrypted key" />
                </View>
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
            <View style={styles.container}>
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
    container: {
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
    generateForm: {
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

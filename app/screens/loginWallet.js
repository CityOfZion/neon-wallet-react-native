import React from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import ModalDropdown from 'react-native-modal-dropdown'
import Button from '../components/Button'

// redux
import { bindActionCreatorsExt } from '../utils/bindActionCreatorsExt'
import { connect } from 'react-redux'
import { ActionCreators } from '../actions'

class LoginWallet extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            buttonText: 'Select wallet',
            walletSelected: false,
            selectedKey: ''
        }
    }
    _walletSelect(idx, value) {
        this.setState({ buttonText: value.name, walletSelected: true, selectedKey: value.key })
    }

    _walletLogin() {
        let passphrase = this.txtPassphrase._lastNativeText
        let selectedKey = this.state.selectedKey
        this.props.wallet.login(passphrase, selectedKey)
    }

    _renderRow(rowData, rowId, highligted) {
        return <Text style={styles.rowText}>{rowData.name}</Text>
    }

    _renderLoginForm() {
        return (
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
                <Button title="Login" onPress={this._walletLogin.bind(this)} />
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
                <Text style={styles.indicatorText}>Decrypting keys...</Text>
            </View>
        )
    }

    _renderWalletSelect() {
        return (
            <View style={styles.selectWalletRow}>
                <Text style={styles.walletText}>Wallet: </Text>
                <ModalDropdown
                    options={this.props.list_options}
                    onSelect={this._walletSelect.bind(this)}
                    renderRow={this._renderRow.bind(this)}
                    dropdownStyle={{ width: 150 }}
                >
                    <View style={{ backgroundColor: '#4D933B', padding: 5, alignItems: 'center' }}>
                        <Text>{this.state.buttonText}</Text>
                    </View>
                </ModalDropdown>
            </View>
        )
    }

    _renderNoWalletsStoredWarning() {
        return (
            <View style={styles.warningView}>
                <Text style={styles.warningText}>No wallets stored on this device.</Text>
                <Text style={styles.warningText}>Go back and first create a new wallet, then try again.</Text>
            </View>
        )
    }

    render() {
        return (
            <View style={styles.container}>
                {this.props.list_options.length > 0 ? this._renderWalletSelect() : this._renderNoWalletsStoredWarning()}
                {this.state.walletSelected ? this._renderLoginForm() : null}
                {this.props.decrypting ? this._renderBarIndicator() : null}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    walletText: {
        fontWeight: 'bold'
    },
    warningView: {
        marginTop: 20
    },
    warningText: {
        color: '#333333',
        fontSize: 14,
        textAlign: 'center',

        marginBottom: 10
    },
    rowText: {
        paddingHorizontal: 6,
        paddingVertical: 10,
        fontSize: 11,
        color: 'gray',
        backgroundColor: 'white',
        textAlignVertical: 'center'
    },
    selectWalletRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginTop: 20,
        alignItems: 'center' // vertical
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
    },
    loginForm: {
        marginTop: 5
    }
})

function mapStateToProps(state, ownProps) {
    let key_pairs = state.wallet.saved_keys
    let keys = Object.keys(key_pairs)
    let options = []
    let longest_name = 0

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        let name = key_pairs[key]
        options.push({ name: name, key: key })

        if (name.length > longest_name) {
            longest_name = name.length
        }
    }

    return {
        list_options: options,
        longest_wallet_name: longest_name,
        decrypting: state.wallet.decrypting
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(LoginWallet)

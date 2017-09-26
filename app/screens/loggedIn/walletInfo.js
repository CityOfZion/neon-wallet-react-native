import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import FAIcons from 'react-native-vector-icons/FontAwesome'
import Button from '../../components/Button'
import Spacer from '../../components/Spacer'
import { ASSET_TYPE } from '../../actions/wallet'
import { DropDownHolder } from '../../utils/DropDownHolder'

// redux
import { connect } from 'react-redux'
import { bindActionCreatorsExt } from '../../utils/bindActionCreatorsExt'
import { ActionCreators } from '../../actions'

import { verifyAddress } from 'neon-js'

class WalletInfo extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        headerLeft: (
            <TouchableOpacity
                onPress={() => {
                    navigation.state.params.handleLogout()
                }}
                style={styles.headerButton}
            >
                <Text style={styles.headerButtonText}>Logout</Text>
            </TouchableOpacity>
        ),
        headerRight: (
            <TouchableOpacity
                onPress={() => {
                    console.log('Switching network')
                }}
                style={styles.headerButton}
            >
                <FAIcons name="plug" size={16} style={styles.network} />
                <Text style={styles.headerButtonText}>Mainnet</Text>
            </TouchableOpacity>
        )
    })

    constructor(props) {
        super(props)
        this.state = {
            selectedAsset: ASSET_TYPE.NEO
        }
        this.dropdown = DropDownHolder.getDropDown()
    }

    componentWillMount() {
        this.props.navigation.setParams({ handleLogout: this._logout.bind(this) })
    }

    _logout() {
        this.props.wallet.logout()
        this.props.wallet.resetState()
    }

    _toggleAsset() {
        const asset = this.state.selectedAsset === ASSET_TYPE.NEO ? ASSET_TYPE.GAS : ASSET_TYPE.NEO
        this.setState({ selectedAsset: asset })
    }

    _isValidInputForm(address, amount, assetType) {
        let result = true
        if (address.length <= 0 || verifyAddress(address) != true) {
            this.dropdown.alertWithType('error', 'Error', 'Not a valid destination address')
            result = false
        }
        if (amount < 0) {
            this.dropdown.alertWithType('error', 'Error', 'Invalid amount')
            result = false
        }

        const balance = assetType == ASSET_TYPE.NEO ? this.props.neo : this.props.gas
        if (amount > balance) {
            this.dropdown.alertWithType('error', 'Error', 'Not enough' + `${assetType}`)
            result = false
        }

        if (assetType == ASSET_TYPE.NEO && parseFloat(amount) !== parseInt(amount)) {
            this.dropdown.alertWithType('error', 'Error', 'Cannot not send fractional amounts of ' + `${assetType}`)
            result = false
        }
        return result
    }

    _sendAsset() {
        const address = this.txtInputAddress._lastNativeText
        const amount = this.txtInputAmount._lastNativeText
        const assetType = this.state.selectedAsset

        // TODO: add confirmation (modal?)
        if (this._isValidInputForm(address, amount, assetType)) {
            this.props.wallet.sendAsset(address, amount, assetType)
            // TODO: clear input amount when successful transferred,
            // TODO: add information instruction that wallet will be updated on next blockchain update.
        }
    }

    _claim() {
        // avoid unnecessary network call
        if (this.props.claimAmount > 0) {
            this.props.wallet.claim()
        }
    }

    render() {
        const claimButtonTitle = 'Claim ' + `${this.props.claimAmount}` + ' GAS'
        return (
            <View style={styles.container}>
                <View style={styles.dataInputView}>
                    <View style={styles.addressRow}>
                        <TextInput
                            ref={txtInput => {
                                this.txtInputAddress = txtInput
                            }}
                            multiline={false}
                            placeholder="Where to send the asset (address)"
                            placeholderTextColor="#636363"
                            returnKeyType="done"
                            style={styles.inputBox}
                            autoCorrect={false}
                        />
                        <View style={styles.addressBook}>
                            <FAIcons name="address-book" size={16} style={styles.network} />
                        </View>
                    </View>
                    <View style={styles.addressRow}>
                        <TextInput
                            ref={txtInput => {
                                this.txtInputAmount = txtInput
                            }}
                            multiline={false}
                            placeholder="Amount"
                            placeholderTextColor="#636363"
                            returnKeyType="done"
                            style={styles.inputBox}
                            autoCorrect={false}
                        />
                        <Button
                            title={this.state.selectedAsset}
                            onPress={this._toggleAsset.bind(this)}
                            style={{ height: 30, marginLeft: 0, marginRight: 20, marginTop: 0, flex: 1, backgroundColor: '#236312' }}
                        />
                    </View>
                    <Button title="Send Asset" onPress={this._sendAsset.bind(this)} />
                </View>
                <View style={styles.addressView}>
                    <Text style={[styles.textAddress, styles.textAddressInfo]}>Your Public Neo Address:</Text>
                    <Text style={styles.textAddress}>{this.props.address}</Text>
                </View>
                <Spacer />
                <View style={styles.content}>
                    <View style={styles.coinCountView}>
                        <Text style={styles.coinCountLabel}>NEO</Text>
                        <Text style={styles.coinCountValue}>{this.props.neo}</Text>
                    </View>
                    <View style={styles.refreshButtonView}>
                        <FAIcons name="refresh" size={24} style={styles.refreshButton} />
                    </View>
                    <View style={styles.coinCountView}>
                        <Text style={styles.coinCountLabel}>GAS</Text>
                        <Text style={styles.coinCountValue}>{this.props.gas}</Text>
                    </View>
                </View>
                <View style={styles.fiatView}>
                    <Text style={styles.fiatValue}>US ${this.props.price}</Text>
                </View>
                <Spacer />
                <Button title={claimButtonTitle} onPress={this._claim.bind(this)} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    headerButton: {
        marginHorizontal: 10,
        flexDirection: 'row'
    },
    headerButtonText: {
        color: 'white'
    },
    network: {
        color: 'white',
        marginRight: 2
    },
    container: {
        flex: 1
    },
    dataInputView: {
        backgroundColor: '#E8F4E5',
        flexDirection: 'column',
        paddingBottom: 10
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center', // vertical
        marginVertical: 5
    },
    addressBook: {
        backgroundColor: '#236312',
        padding: 5,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20
    },
    inputBox: {
        marginHorizontal: 20,
        marginVertical: 5,
        paddingHorizontal: 10,
        height: 30,
        fontSize: 14,
        backgroundColor: 'white',
        color: '#333333',
        flex: 1
    },
    addressView: {
        marginTop: 10
    },
    textAddressInfo: {
        // fontWeight: 'bold'
    },
    textAddress: {
        fontSize: 12,
        textAlign: 'center'
    },
    content: {
        flexDirection: 'row'
    },
    coinCountView: {
        flexDirection: 'column',
        flex: 0.35,
        alignItems: 'center' // horizontal
    },
    coinCountLabel: {
        fontSize: 14,
        fontWeight: '300'
    },
    coinCountValue: {
        fontSize: 40,
        fontWeight: '200'
    },
    refreshButtonView: {
        flexDirection: 'column',
        flex: 0.3,
        alignItems: 'center', // horizontal
        justifyContent: 'center'
    },
    refreshButton: {
        color: '#4D933B'
    },
    fiatView: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    fiatValue: {
        fontWeight: '300'
    }
})

function mapStateToProps(state, ownProps) {
    return {
        address: state.wallet.address,
        neo: state.wallet.neo,
        gas: state.wallet.gas,
        price: state.wallet.price * state.wallet.neo,
        claimAmount: state.wallet.claimAmount
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)

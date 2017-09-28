import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { verifyAddress } from 'neon-js'
import FAIcons from 'react-native-vector-icons/FontAwesome'

import Button from '../components/Button'
import { ASSET_TYPE } from '../actions/wallet'
import { DropDownHolder } from '../utils/DropDownHolder'

// redux
import { connect } from 'react-redux'
import { bindActionCreatorsExt } from '../utils/bindActionCreatorsExt'
import { ActionCreators } from '../actions'

class AssetSendForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedAsset: ASSET_TYPE.NEO
        }
        this.dropdown = DropDownHolder.getDropDown()
    }

    _toggleAsset() {
        const asset = this.state.selectedAsset === ASSET_TYPE.NEO ? ASSET_TYPE.GAS : ASSET_TYPE.NEO
        this.setState({ selectedAsset: asset })
    }

    _isValidInputForm(address, amount, assetType) {
        let result = true
        if (address.length <= 0 || verifyAddress(address) != true || address.charAt(0) !== 'A') {
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

    render() {
        return (
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
        )
    }
}

const styles = StyleSheet.create({
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
    }
})

function mapStateToProps(state, ownProps) {
    return {
        neo: state.wallet.neo,
        gas: state.wallet.gas
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(AssetSendForm)

import React from 'react'
import { ScrollView, View, Text, StyleSheet, TextInput, Clipboard } from 'react-native'
import KeyDataRow from './KeyDataRow'
import Button from './Button'
import { DropDownHolder } from '../utils/DropDownHolder'

class GeneratedKeysView extends React.Component {
    constructor(props) {
        super(props)
        this.dropdown = DropDownHolder.getDropDown()
        this.state = {
            saveDisabled: true,
            saved: false
        }
    }

    _saveKey() {
        this.props.saveKeyCallback(this.txtKeyName._lastNativeText)
        this.txtKeyName.blur()
        this.setState({ saved: true })
    }

    _txtKeyNameChanged(text) {
        text.length > 0 ? this.setState({ saveDisabled: false }) : this.setState({ saveDisabled: true })
    }

    _renderStoreOnDevice() {
        if (!this.state.saved) {
            return (
                <View>
                    <View style={styles.spacer} />
                    <Text style={[styles.instructionText, { textAlign: 'left', marginLeft: 20 }]}>Store on device</Text>
                    <TextInput
                        ref={txtInput => {
                            this.txtKeyName = txtInput
                        }}
                        multiline={false}
                        placeholder="Name this key"
                        placeholderTextColor="#636363"
                        returnKeyType="done"
                        style={styles.inputBox}
                        autoCorrect={false}
                        onChangeText={this._txtKeyNameChanged.bind(this)}
                    />
                    {this.state.saveDisabled ? null : <Button onPress={this._saveKey.bind(this)} title="Save key" />}
                    <View style={{ height: 10, backgroundColor: 'white' }} />
                </View>
            )
        } else {
            return (
                <View>
                    <View style={styles.spacer} />
                    <Text style={[styles.instructionText, { marginTop: 20 }]}>Key "{this.txtKeyName._lastNativeText}" saved!</Text>
                </View>
            )
        }
    }

    _copyToClipBoard() {
        const { passphrase, address, encryptedWif, wif } = this.props
        const data = {
            passphrase: passphrase,
            public_address: address,
            encrypted_key: encryptedWif,
            private_key: wif
        }
        Clipboard.setString(JSON.stringify(data))
        this.dropdown.alertWithType('info', 'Success', 'Data copied to clipboard. Be careful where you paste the data!')
    }

    render() {
        const { passphrase, address, encryptedWif, wif } = this.props
        return (
            <ScrollView>
                <View style={styles.warningView}>
                    <Text style={styles.warningText}>
                        You must save and backup the keys below. If you lose them, you lose access to your assets. You can click "Save Key"
                        to save the encrypted key on your mobile device. Note that a rooted or jailbroken phone can pose a risk to your
                        keys. Verify that you can log in to the account and see the correct public address before sending anything to the
                        address below!
                    </Text>
                </View>
                <View style={styles.dataList}>
                    <KeyDataRow title="Passphrase" value={passphrase} />
                    <KeyDataRow title="Public address" value={address} />
                    <KeyDataRow title="Encrypted key" value={encryptedWif} />
                    <KeyDataRow title="Private key" value={wif} />
                </View>
                <Button onPress={this._copyToClipBoard.bind(this)} title="Copy data to clipboard" />
                <Button
                    onPress={() => {
                        alert('Not functional yet')
                    }}
                    title="Email data"
                />
                {this._renderStoreOnDevice()}
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    warningView: {
        flexDirection: 'row',
        backgroundColor: 'red'
    },
    warningText: {
        marginHorizontal: 20,
        paddingVertical: 5,
        color: 'white'
    },
    dataList: {
        flexDirection: 'column',
        justifyContent: 'flex-start' // vertical
    },
    spacer: {
        height: 2,
        backgroundColor: '#EFEFEF',
        marginHorizontal: 30,
        marginVertical: 20
    },
    inputBox: {
        marginHorizontal: 20,
        marginVertical: 5,
        paddingLeft: 10,
        // paddingTop: 5,
        height: 30,
        fontSize: 14,
        backgroundColor: '#E8F4E5',
        color: '#333333'
    },
    instructionText: {
        color: '#333333',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10
    }
})

export default GeneratedKeysView

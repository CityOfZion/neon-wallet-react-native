import React from 'react'
import { connect } from 'react-redux'
import { View, Text, FlatList, StyleSheet, TouchableHighlight } from 'react-native'
import { deleteKey } from '../actions/settings'

class Settings extends React.Component {
    _renderSeparator = () => {
        return <View style={styles.separator} />
    }

    _delete(key) {
        this.props.navigation.dispatch(deleteKey(key))
    }

    _renderRow(item) {
        const keyPair = item.item
        return (
            <View style={styles.keyRow}>
                <View style={styles.keyNameView}>
                    <Text style={styles.keyNameText}>{keyPair.name}</Text>
                </View>
                <TouchableHighlight
                    onPress={() => {
                        this._delete(keyPair.key)
                    }}
                    style={styles.deleteButton}
                    underlayColor={'#FF0000AA'}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableHighlight>
            </View>
        )
    }

    render() {
        const { keys } = this.props
        const title = keys.length > 0 ? 'Saved wallet keys' : 'No saved wallet keys'
        const hideKeys = keys.length == 0

        return (
            <View>
                <View style={styles.titleView}>
                    <Text style={styles.titleText}>{title}</Text>
                </View>
                {hideKeys ? null : (
                    <FlatList
                        ItemSeparatorComponent={this._renderSeparator}
                        data={this.props.keys}
                        renderItem={this._renderRow.bind(this)}
                        keyExtractor={item => item.key}
                    />
                )}
            </View>
        )
    }
}

const styles = StyleSheet.create({
    titleView: {
        marginTop: 20
    },
    titleText: {
        color: '#333333',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10
    },
    keyRow: {
        flexDirection: 'row',
        height: 48,
        flex: 1
    },
    keyNameView: {
        flex: 0.7,
        justifyContent: 'center' // vertical
    },
    keyNameText: {
        marginLeft: 30
    },
    deleteButton: {
        flex: 0.3,
        justifyContent: 'center', // vertical
        alignItems: 'center', // horizontal
        backgroundColor: 'red'
    },
    deleteButtonText: {
        color: 'white'
    },
    separator: {
        height: 1,
        backgroundColor: 'white' //'#CED0CE'
    }
})

function mapStateToProps(state, ownProps) {
    let key_pairs = state.settings.saved_keys
    let keys = Object.keys(key_pairs)
    let keyList = []

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i]
        let name = key_pairs[key]
        keyList.push({ name: name, key: key })
    }

    return {
        keys: keyList
    }
}

export default connect(mapStateToProps)(Settings)

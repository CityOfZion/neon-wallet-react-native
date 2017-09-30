import React from 'react'
import { View, Text, FlatList, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import { nDecimalsNoneZero } from '../../utils/walletStuff'

class TransactionHistory extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        headerLeft: null
    })

    _renderRow(item) {
        // type: 'NEO', amount: tx.NEO, txid: tx.txid, block_index: tx.block_index }
        const tx = item.item
        return (
            <View style={styles.txRow}>
                <View style={styles.txId}>
                    <Text>{tx.txid.slice(0, 15)}..</Text>
                </View>
                <View style={styles.txValue}>
                    <Text style={styles.bigText}>{nDecimalsNoneZero(tx.amount, 6)}</Text>
                    <Text style={styles.bigText}>{tx.type}</Text>
                </View>
            </View>
        )
    }

    _renderSeparator = () => {
        return (
            <View
                style={{
                    height: 1,
                    backgroundColor: '#CED0CE'
                }}
            />
        )
    }

    render() {
        return (
            <View>
                <FlatList
                    ItemSeparatorComponent={this._renderSeparator}
                    data={this.props.transactions}
                    renderItem={this._renderRow.bind(this)}
                    keyExtractor={item => item.txid}
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    txRow: {
        flexDirection: 'row',
        marginHorizontal: 30,
        height: 48
    },
    txId: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    txText: {
        fontSize: 10,
        fontFamily: 'courier new'
    },
    txValue: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    bigText: {
        fontSize: 20,
        marginLeft: 5,
        fontFamily: 'courier'
    }
})

function mapStateToProps(state, ownProps) {
    return {
        transactions: state.wallet.transactions
    }
}

export default connect(mapStateToProps)(TransactionHistory)

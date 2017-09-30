import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import FAIcons from 'react-native-vector-icons/FontAwesome'
import Button from '../../components/Button'
import Spacer from '../../components/Spacer'
import NetworkSwitchButton from '../../containers/NetworkSwitchButton'
import AssetSendForm from '../../containers/AssetSendForm'
import ClaimProgressIndicator from '../../containers/ClaimProgressIndicator'

// redux
import { connect } from 'react-redux'
import { bindActionCreatorsExt } from '../../utils/bindActionCreatorsExt'
import { ActionCreators } from '../../actions'

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
        headerRight: <NetworkSwitchButton />
    })

    constructor(props) {
        super(props)
        this.state = {
            claimStarted: false
        }
    }

    componentDidMount() {
        this.props.navigation.setParams({ handleLogout: this._logout.bind(this) })
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.gasClaimConfirmed == true) {
            // flow is done, we can reset now
            this.setState({ claimStarted: false })
        }
    }

    _logout() {
        this.props.wallet.logout()
    }

    _claim() {
        // avoid unnecessary network call
        if (this.props.claimAmount > 0) {
            this.props.wallet.claim()
            this.setState({ claimStarted: true })
        }
    }

    _nDecimalsNoneZero(input, n) {
        // return n decimals places, only if non-zero
        const decimalPlaces = Math.pow(10, n)
        return Math.round(input * decimalPlaces) / decimalPlaces
    }

    render() {
        const claimButtonTitle = 'Claim ' + `${this.props.claimAmount}` + ' GAS'
        const neoBalance = this._nDecimalsNoneZero(this.props.neo, 3)
        const gasBalance = this._nDecimalsNoneZero(this.props.gas, 3)
        return (
            <View style={styles.container}>
                <AssetSendForm />
                <View style={styles.addressView}>
                    <Text style={styles.textAddress}>Your Public Neo Address:</Text>
                    <Text style={styles.textAddress}>{this.props.address}</Text>
                </View>
                <Spacer />
                <View style={styles.content}>
                    <View style={styles.coinCountView}>
                        <Text style={styles.coinCountLabel}>NEO</Text>
                        <Text style={[styles.coinCountValue, this.props.pendingBlockConfirm ? styles.pendingConfirm : null]}>
                            {neoBalance}
                        </Text>
                    </View>
                    <View style={styles.refreshButtonView}>
                        <FAIcons name="refresh" size={24} style={styles.refreshButton} />
                    </View>
                    <View style={styles.coinCountView}>
                        <Text style={styles.coinCountLabel}>GAS</Text>
                        <Text style={[styles.coinCountValue, this.props.pendingBlockConfirm ? styles.pendingConfirm : null]}>
                            {gasBalance}
                        </Text>
                    </View>
                </View>
                <View style={styles.fiatView}>
                    <Text style={styles.fiatValue}>US ${this.props.price.toFixed(2)}</Text>
                </View>
                <View style={styles.pendingView}>
                    <Text style={this.props.pendingBlockConfirm ? styles.pendingConfirm : styles.invisible}>
                        (Pending block confirmation)
                    </Text>
                </View>
                <Spacer />
                {this.state.claimStarted && !this.props.gasClaimConfirmed ? (
                    <View style={styles.claimProgress}>
                        <ClaimProgressIndicator />
                    </View>
                ) : (
                    <Button title={claimButtonTitle} onPress={this._claim.bind(this)} />
                )}
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
    container: {
        flex: 1
    },
    addressView: {
        marginTop: 10
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
    },
    pendingConfirm: {
        color: '#939393'
    },
    pendingView: {
        flexDirection: 'row',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    invisible: {
        color: 'white'
    },
    claimProgress: {
        marginLeft: 30,
        opacity: 0.5
    }
})

function mapStateToProps(state, ownProps) {
    return {
        address: state.wallet.address,
        neo: state.wallet.neo,
        gas: state.wallet.gas,
        price: state.wallet.price,
        claimAmount: state.wallet.claimAmount,
        pendingBlockConfirm: state.wallet.pendingBlockConfirm,
        gasClaimConfirmed: state.claim.gasClaimConfirmed
    }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(WalletInfo)

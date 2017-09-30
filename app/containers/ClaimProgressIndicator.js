import React from 'react'
import { View, Text } from 'react-native'

// redux
import { connect } from 'react-redux'

class ClaimProgressIndicator extends React.Component {
    _renderUnspendToClear() {
        const { sentToSelfSuccess, transactionCleared } = this.props
        return (
            <View>
                <Text>Unspent claim found, trying to clear...{transactionCleared ? 'success!' : null}</Text>
                <Text style={{ paddingLeft: 10 }}>Sending Neo to yourself...{sentToSelfSuccess ? 'success!' : null}</Text>
                {sentToSelfSuccess ? this._renderWaitingForTransactionToClear() : null}
            </View>
        )
    }

    _renderWaitingForTransactionToClear() {
        const { transactionCleared } = this.props
        return <Text style={{ paddingLeft: 10 }}>Waiting for transaction to clear...{transactionCleared ? 'success!' : null}</Text>
    }

    _renderClaimingGAS() {
        const { gasClaimed } = this.props
        return <Text>Attempting to claim all available gas...{gasClaimed ? 'success!' : null}</Text>
    }

    _renderWaitingForGasToClear() {
        const { gasClaimConfirmed } = this.props
        return <Text>Waiting for GAS balance to update...{gasClaimConfirmed ? 'success!' : null}</Text>
    }

    render() {
        const { unspendToClear, transactionCleared, gasClaimed } = this.props
        return (
            <View>
                {unspendToClear ? this._renderUnspendToClear() : null}
                {transactionCleared ? this._renderClaimingGAS() : null}
                {gasClaimed ? this._renderWaitingForGasToClear() : null}
            </View>
        )
    }
}

function mapStateToProps(state, ownProps) {
    return {
        unspendToClear: state.claim.unspendToClear,
        transactionCleared: state.claim.transactionCleared,
        gasClaimed: state.claim.gasClaimed, // true
        sentToSelfSuccess: state.claim.sentToSelfSuccess,
        gasClaimConfirmed: state.claim.gasClaimConfirmed
    }
}

export default connect(mapStateToProps)(ClaimProgressIndicator)
/*
* Unspent claim found, trying to clear…  (UNSPEND_CLAIM_TO_CLEAR) 
** Sending Neo to Yourself…success   (SEND_ASSET_SUCCESS, sentToSelf: true) 
** Waiting for transaction to clear…success (TRANSACTION_TO_SELF_CLEARED)
* Attempting to claim all available gas…success (CLAIM_GAS_SUCCESS)
* Waiting for GAS balance to update…done
*/

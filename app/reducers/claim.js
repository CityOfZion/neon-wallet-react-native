import { ActionConstants as actions } from '../actions'

export default function claim(state = {}, action) {
    switch (action.type) {
        case actions.wallet.UNSPEND_CLAIM_TO_CLEAR:
            return {
                ...state,
                unspendToClear: true
            }
        case actions.wallet.SEND_ASSET_SUCCESS:
            if (action.sentToSelf == true) {
                return {
                    ...state,
                    sentToSelfSuccess: true
                }
            } else {
                return state
            }
        case actions.wallet.TRANSACTION_TO_SELF_CLEARED:
        case actions.wallet.CLAIM_GAS_START: // incase there was no unspend claim for which a transaction has to be cleared
            return {
                ...state,
                transactionCleared: true
            }
        case actions.wallet.CLAIM_GAS_SUCCESS:
            return {
                ...state,
                gasClaimed: true
            }
        case actions.wallet.RESET_STATE:
            return {
                ...state,
                unspendToClear: false,
                sentToSelfSuccess: false,
                transactionCleared: false,
                gasClaimed: false
            }
        case actions.wallet.CLAIM_GAS_CONFIRMED_BY_BLOCKCHAIN:
            return {
                ...state,
                unspendToClear: false,
                sentToSelfSuccess: false,
                transactionCleared: false,
                gasClaimed: false,
                gasClaimConfirmed: true
            }
        default:
            return state
    }
}

/*
* Unspent claim found, trying to clear…  (UNSPEND_CLAIM_TO_CLEAR)
** Sending Neo to Yourself…success   (SEND_ASSET_SUCCESS, sentToSelf: true)
** Waiting for transaction to clear…success (TRANSACTION_TO_SELF_CLEARED)
* Attempting to claim all available gas…success (CLAIM_GAS_SUCCESS)
* Waiting for GAS balance to update…done
*/

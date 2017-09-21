import React from 'react'
import { View, Text } from 'react-native'

class TransactionHistory extends React.Component {
    static navigationOptions = ({ navigation }) => ({
        headerLeft: null
    })

    render() {
        return (
            <View>
                <Text>Transactsion history</Text>
            </View>
        )
    }
}

export default TransactionHistory

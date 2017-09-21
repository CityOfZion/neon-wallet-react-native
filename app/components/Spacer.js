import React from 'react'
import { View } from 'react-native'

class Spacer extends React.Component {
    render() {
        return (
            <View
                style={{
                    height: 2,
                    backgroundColor: '#EFEFEF',
                    marginHorizontal: 30,
                    marginVertical: 20
                }}
            />
        )
    }
}

export default Spacer

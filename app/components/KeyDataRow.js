import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import PropTypes from 'prop-types'

class KeyDataRow extends React.Component {
    render() {
        return (
            <View style={styles.dataRow}>
                <Text style={styles.dataItem}>{this.props.title}: </Text>
                <Text>{this.props.value}</Text>
            </View>
        )
    }
}

KeyDataRow.propTypes = {
    title: PropTypes.string,
    value: PropTypes.string
}

const styles = StyleSheet.create({
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // horizontal
        flexWrap: 'wrap',
        marginHorizontal: 20,
        marginVertical: 5
    },
    dataItem: {
        fontWeight: 'bold'
    }
})

export default KeyDataRow

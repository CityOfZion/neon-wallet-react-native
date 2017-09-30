import React from 'react'
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'
import PropTypes from 'prop-types'

const TILE_MARGIN = 20 // left&right+middle

class Tile extends React.Component {
    render() {
        const { title, onPress, dark } = this.props
        return (
            <TouchableOpacity onPress={onPress}>
                <View style={[styles.box, { backgroundColor: dark ? '#236312' : '#4D933B' }]}>
                    <Text style={styles.title}>{title}</Text>
                </View>
            </TouchableOpacity>
        )
    }
}

Tile.propTypes = {
    onPress: PropTypes.func,
    title: PropTypes.string
}

const styles = StyleSheet.create({
    box: {
        width: Dimensions.get('window').width / 2 - TILE_MARGIN,
        height: Dimensions.get('window').width / 2 - TILE_MARGIN,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5
    },
    title: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        padding: 15,
        color: 'white',
        fontSize: 18,
        textAlign: 'center'
    }
})

export default Tile

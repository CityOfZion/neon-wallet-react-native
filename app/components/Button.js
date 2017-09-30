import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import PropTypes from 'prop-types'

class Button extends React.Component {
    static defaultProps = {
        disabled: false
    }

    render() {
        return (
            <TouchableOpacity onPress={this.props.onPress} style={[styles.button, this.props.style]} disabled={this.props.disabled}>
                <Text style={styles.buttonText}>{this.props.title}</Text>
            </TouchableOpacity>
        )
    }
}

Button.propTypes = {
    onPress: PropTypes.func,
    title: PropTypes.string
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#4D933B',
        marginHorizontal: 20,
        height: 40,
        marginTop: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttonText: {
        color: 'white',
        fontSize: 14
    }
})

export default Button

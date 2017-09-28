import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import FAIcons from 'react-native-vector-icons/FontAwesome'

//redux
import { connect } from 'react-redux'
import { bindActionCreatorsExt } from '../utils/bindActionCreatorsExt'
import { ActionCreators } from '../actions'

class NetworkSwitchButton extends React.Component {
    render() {
        return (
            <TouchableOpacity
                onPress={() => {
                    this.props.network.toggle()
                }}
                style={styles.headerButton}
            >
                <FAIcons name="plug" size={16} style={styles.network} />
                <Text style={styles.headerButtonText}>{this.props.connectedNetwork}</Text>
            </TouchableOpacity>
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
    network: {
        color: 'white',
        marginRight: 2
    }
})

function mapStateToProps(state, ownProps) {
    return { connectedNetwork: state.network.net }
}

const mapDispatchToProps = dispatch => {
    return bindActionCreatorsExt(ActionCreators, dispatch)
}
export default connect(mapStateToProps, mapDispatchToProps)(NetworkSwitchButton)

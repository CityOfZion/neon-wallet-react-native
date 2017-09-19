import React from 'react'

// Navigation
import { addNavigationHelpers } from 'react-navigation'
import { RootStackNavigator } from './RootNavigationConfiguration'

// Redux
import { connect } from 'react-redux'

class RootStackNavigation extends React.Component {
    render() {
        const { dispatch, navigationState } = this.props
        return (
            <RootStackNavigator
                navigation={addNavigationHelpers({
                    dispatch: dispatch,
                    state: navigationState
                })}
            />
        )
    }
}

const mapStateToProps = state => {
    return {
        navigationState: state.rootStackNav
    }
}

export default connect(mapStateToProps)(RootStackNavigation)

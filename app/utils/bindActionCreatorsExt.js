function bindActionCreator(actionCreator, dispatch) {
    return function() {
        return dispatch(actionCreator.apply(undefined, arguments))
    }
}

function bindObject(actionCreators, dispatch) {
    var keys = Object.keys(actionCreators)
    var boundActionCreators = {}
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var actionCreator = actionCreators[key]
        if (typeof actionCreator === 'function') {
            boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
        }
        if (typeof actionCreator === 'object') {
            var objs = bindObject(actionCreator, dispatch)
            if (Object.keys(objs).length > 0) {
                boundActionCreators[key] = objs
            }
        }
    }
    return boundActionCreators
}

export function bindActionCreatorsExt(actionCreators, dispatch) {
    if (typeof actionCreators === 'function') {
        return bindActionCreator(actionCreators, dispatch)
    }

    if (typeof actionCreators !== 'object' || actionCreators === null) {
        throw new Error(
            'bindActionCreators expected an object or a function, instead received ' +
                (actionCreators === null ? 'null' : typeof actionCreators) +
                '. ' +
                'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?'
        )
    }

    var boundActionCreators = bindObject(actionCreators, dispatch)

    return boundActionCreators
}

export default bindActionCreatorsExt

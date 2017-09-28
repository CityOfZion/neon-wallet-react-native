const SWITCH = 'NETWORK/SWITCH'
const UPDATE_BLOCK_HEIGHT = 'NETWORK/UPDATE_BLOCK_HEIGHT'
const SET_BLOCK_HEIGHT = 'NETWORK/SET_BLOCK_HEIGHT'
const TOGGLE = 'NETWORK/TOGGLE'

export const NETWORK_MAIN = 'MainNet'
export const NETWORK_TEST = 'TestNet'

export const constants = {
    SWITCH,
    TOGGLE,
    UPDATE_BLOCK_HEIGHT,
    SET_BLOCK_HEIGHT
}

export function switchTo(network) {
    return {
        type: SWITCH,
        network
    }
}

export function toggle() {
    return {
        type: TOGGLE
    }
}

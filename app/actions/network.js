const SWITCH = 'NETWORK/SWITCH'
export const NETWORK_MAIN = 'MainNet'
export const NETWORK_TEST = 'TestNet'

export const constants = {
    SWITCH
}

export function switchTo(network) {
    return {
        type: SWITCH,
        network
    }
}

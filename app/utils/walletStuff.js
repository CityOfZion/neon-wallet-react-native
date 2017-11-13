import { DropDownHolder } from '../utils/DropDownHolder'

export function isBlockedByTransportSecurityPolicy(error) {
    // Test for iOS policy: "The resource could not be loaded because the App Transport Security policy requires the use of a secure connection."
    let result = { blockedByPolicy: false, blockedDomain: '' }
    if (
        error.message != undefined &&
        error.message === 'Network Error' &&
        error.request._response.includes('App Transport Security policy')
    ) {
        result.blockedByPolicy = true
        result.blockedDomain = error.request._url
    }
    return result
}

export function nDecimalsNoneZero(input, n) {
    // return n decimals places, only if non-zero
    const decimalPlaces = Math.pow(10, n)
    return Math.round(input * decimalPlaces) / decimalPlaces
}

export function isValidPassphrase(pw1, pw2) {
    var result = false
    if (pw1 && pw2) {
        if (pw1.length < 5) {
            DropDownHolder.getDropDown().alertWithType('error', 'Error', 'Passphrase too short. Minimal 5 characters.')
        } else if (pw1 !== pw2) {
            DropDownHolder.getDropDown().alertWithType('error', 'Error', 'Passphrases do not match')
        } else {
            result = true
        }
    } else {
        DropDownHolder.getDropDown().alertWithType('error', 'Error', 'Passphrases cannot be empty')
    }
    return result
}

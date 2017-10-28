import 'react-native'
import { encryptWIF, decryptWIF } from '../app/api/crypto'

// use official test vectors from https://github.com/neo-project/proposals/blob/master/nep-2.mediawiki#test-vectors
const unencryptedWIF = 'L44B5gGEpqEDRS9vVPz7QT35jcBG2r3CZwSwQ4fCewXAhAhqGVpP'
const passphrase = 'TestingOneTwoThree'
const encryptedWIF = '6PYVPVe1fQznphjbUxXP9KZJqPMVnVwCx5s5pr5axRJ8uHkMtZg97eT5kL'

it('should encrypt a WIF correctly', () => {
    expect(encryptWIF(unencryptedWIF, passphrase)).toEqual(encryptedWIF)
})

it('should decrypt a WIF correctly', () => {
    expect(decryptWIF(encryptedWIF, passphrase)).toEqual(unencryptedWIF)
})

it('should notify about an incorrect passphrase when failing to decrypt a WIF', () => {
    expect(function() {
        decryptWIF(encryptedWIF, 'wrongPassphrase')
    }).toThrowError('Wrong Password!')
})

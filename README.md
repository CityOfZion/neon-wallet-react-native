### About
A NEO light-wallet for Android and iOS build using react-native. It's aim is to closely resemble the look and feel of [Neon-wallet](https://github.com/CityOfZion/neon-wallet) so you'll feel right at home if you used that before or use it on the side.

<aside class="warning">
Use at your own risk! It's still in development stages. While I tried to make it completely error free (as I use it myself) no guarantees can be given. Tests need to be writted to increase assurance. 100% is never achievable.
</aside>

![wallet](/Screenshot.png)

### Installation
`npm install`

### Run
`react-native run-ios`
or
`react-native run-android`

### Road map
**V1 (Feature parity with [Neon-wallet](https://github.com/CityOfZion/neon-wallet))**

[ ] ~~Implement wallet settings screen~~ (and enable redux-persist)

[ ] ~~Refactor to remove neon-js package dependency~~

[ ] Add tests

**V2 (Extra features)**

[ ] WalletInfo.js, make address book button functional 

[ ] GeneratedKeysView.js , make "email data" button functional

[ ] add QR scanning of keys

[ ] add [NEP5 support](https://github.com/neo-project/proposals/pull/4) (ICO tokens)

**Vn (Nice to have)
[ ] Completely remove any node core/rn-nodeify dependencies (i.e. find pure replacements for crypto or move all to native)
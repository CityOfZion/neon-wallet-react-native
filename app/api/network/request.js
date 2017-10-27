// import { getStore } from '../../store'

// let store = getStore()
// store.subscribe(listener)

let rpcUrl = null

function listener() {
    // let network = store.getState().network.net
    rpcUrl = network === 'MainNet' ? 'http://api.wallet.cityofzion.io' : 'http://testnet-api.wallet.cityofzion.io'
}

const request = function(url, options = {}, ignore_base_url = false) {
    const onSuccess = function(response) {
        // console.debug(('request success!', response))
        if (response.status >= 200 && response.status < 300) {
            return Promise.resolve(response.json())
        } else {
            return Promise.reject(new Error(response.statusText))
        }
    }

    const onError = function(error) {
        console.error('Request failed', error)
        e = new Error(error)
        if (error.message === 'Network request failed') {
            e.networkUnreachable = true
        }
        return Promise.reject(e)
    }

    if (ignore_base_url) {
        base_url = ''
    } else {
        base_url = 'http://testnet-api.wallet.cityofzion.io' //rpcUrl
    }

    init = {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'GET',
        ...options
    }

    return fetch(base_url + url, init)
        .then(onSuccess)
        .catch(onError)
}

export default request

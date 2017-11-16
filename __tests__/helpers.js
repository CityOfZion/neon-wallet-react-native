import nock from 'nock'

export const mockGetDBHeight = function(height_return_value) {
    let matcher = nock('http://testnet-api.wallet.cityofzion.io').get('/v2/block/height')
    if (height_return_value) {
        return matcher.reply(200, {
            block_height: height_return_value,
            net: 'TestNet'
        })
    } else {
        return matcher
    }
}

export const mockGetBalance = function(balanceNEO, balanceGAS) {
    let matcher = nock('http://testnet-api.wallet.cityofzion.io')
        .filteringPath(function(path) {
            if (path.includes('/v2/address/balance/')) {
                return '/v2/address/balance/'
            } else {
                return path
            }
        })
        .get('/v2/address/balance/')

    if (balanceNEO !== undefined && balanceGAS !== undefined) {
        return matcher.reply(200, {
            GAS: {
                balance: balanceGAS,
                unspent: []
            },
            NEO: {
                balance: balanceNEO,
                unspent: []
            },
            address: 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt',
            net: 'TestNet'
        })
    } else {
        return matcher
    }
}

export const mockGetHistory = function(history) {
    let matcher = nock('http://testnet-api.wallet.cityofzion.io')
        .persist()
        .filteringPath(function(path) {
            if (path.includes('/v2/address/history/')) {
                return '/v2/address/history/'
            } else {
                return path
            }
        })
        .get('/v2/address/history/')
    if (history) {
        matcher.reply(200, {
            address: 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt',
            history: history,
            name: 'transaction_history',
            net: 'TestNet'
        })
    } else {
        return matcher
    }
}

export const mockClaims = function(claims, total_claim = 0, total_unspent_claim = 0) {
    let matcher = nock('http://testnet-api.wallet.cityofzion.io')
        .filteringPath(function(path) {
            if (path.includes('/v2/address/claims/')) {
                return '/v2/address/claims/'
            } else {
                return path
            }
        })
        .get('/v2/address/claims/')

    if (claims) {
        matcher.reply(200, {
            address: 'AStZHy8E6StCqYQbzMqi4poH7YNDHQKxvt',
            claims: claims,
            net: 'TestNet',
            total_claim: total_claim,
            total_unspent_claim: total_unspent_claim
        })
    } else {
        return matcher
    }
}

export const mockTicker = function(bid, ask, last) {
    let matcher = nock('https://bittrex.com')
        .persist()
        .get('/api/v1.1/public/getticker?market=USDT-NEO')

    if (bid && ask && last) {
        matcher.reply(200, {
            success: true,
            message: '',
            result: { Bid: bid, Ask: ask, Last: last }
        })
    } else {
        return matcher
    }
}

export const mockGetRPCEndpoint = function(nodeAddress) {
    let matcher = nock('http://testnet-api.wallet.cityofzion.io')
        .filteringPath(function(path) {
            if (path.includes('/v2/network/best_node')) {
                return '/v2/network/best_node'
            } else {
                return path
            }
        })
        .get('/v2/network/best_node')

    if (nodeAddress) {
        return matcher.reply(200, {
            net: 'TestNet',
            node: nodeAddress // "http://test3.cityofzion.io:8880"
        })
    } else {
        return matcher
    }
}

export const mockQueryRPC = function(rpcAddress, id, result) {
    let matcher = nock(rpcAddress)
        .get('/')
        .reply(200, {
            jsonrpc: '2.0',
            id: id,
            result: result // bool
        })
}

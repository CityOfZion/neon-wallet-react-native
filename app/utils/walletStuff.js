export function getMarketPriceUSD() {
    return fetch('https://bittrex.com/api/v1.1/public/getticker?market=USDT-NEO')
        .then(response => {
            if (response.status >= 200 && response.status < 300) {
                return Promise.resolve(response.json())
            } else {
                return Promise.reject(new Error(response.statusText))
            }
        })
        .then(response => {
            console.log(response)
            return response.result.Last
            // return '$' + (lastUSDNEO * amount).toFixed(2).toString()
        })
}

// taken from 'neon-js' to get transaction signing up a.s.a.p
// will replace later with a cleaned up version

import bs58 from 'bs58'
import CryptoJS from 'crypto-js'
import { ec } from 'elliptic'

export const getHash = $SignatureScript => CryptoJS.RIPEMD160(CryptoJS.SHA256(CryptoJS.enc.Hex.parse($SignatureScript)))
export const createSignatureScript = $publicKeyEncoded => `21${$publicKeyEncoded.toString('hex')}ac`
export const transferTransaction = (coins, publicKeyEncoded, toAddress, amount) => {
    // if (!verifyAddress(toAddress)) {
    //     throw new Error('Invalid toAddress')
    // }
    let programHash = bs58.decode(toAddress)
    programHash = programHash.slice(1, 21)

    let signatureScript = createSignatureScript(publicKeyEncoded).toString('hex')
    let myProgramHash = getHash(signatureScript)

    // Construct Inputs
    let inputData = getInputData(coins, amount)
    if (inputData === -1) return null
    // console.log('wallet inputData', inputData )

    let inputLen = inputData.data.length
    let inputAmount = inputData.amount

    // console.log(inputLen, inputAmount, $Amount)

    // Set SignableData Len
    // We can do this because this method assumes only one recipient.
    let signableDataLen = 124 + inputLen
    if (inputAmount === amount) {
        signableDataLen = 64 + inputLen
    }

    // Initialise transaction array
    let data = new Uint8Array(signableDataLen)

    // Type
    data.set(hexstring2ab('80'), 0)

    // Version
    data.set(hexstring2ab('00'), 1)

    // Attributes
    data.set(hexstring2ab('00'), 2)

    // INPUT array
    data.set(inputData.data, 3)

    // Construct Outputs
    if (inputAmount === amount) {
        // only one output

        // output array length indicator
        data.set(hexstring2ab('01'), inputLen + 3)

        // OUTPUT - 0
        // output asset
        data.set(reverseArray(hexstring2ab(coins['assetid'])), inputLen + 4)
        // data.set(hexstring2ab($coin['assetid']), inputLen + 4)

        // output value
        const num1 = parseInt(amount * 100000000)
        const num1str = numStoreInMemory(num1.toString(16), 16)
        data.set(hexstring2ab(num1str), inputLen + 36)

        // output ProgramHash
        data.set(programHash, inputLen + 44)
    } else {
        // output num
        data.set(hexstring2ab('02'), inputLen + 3)

        // OUTPUT - 0

        // output asset
        data.set(reverseArray(hexstring2ab(coins['assetid'])), inputLen + 4)
        // data.set(hexstring2ab($coin['assetid']), inputLen + 4);

        // output value
        const num1 = parseInt(amount * 100000000)
        const num1str = numStoreInMemory(num1.toString(16), 16)
        data.set(hexstring2ab(num1str), inputLen + 36)

        // output ProgramHash
        data.set(programHash, inputLen + 44)

        // OUTPUT - 1

        // output asset
        data.set(reverseArray(hexstring2ab(coins['assetid'])), inputLen + 64)
        // data.set(hexstring2ab($coin['assetid']), inputLen + 64);

        // output value
        const num2 = parseInt(inputAmount * 100000000 - num1)
        const num2str = numStoreInMemory(num2.toString(16), 16)
        data.set(hexstring2ab(num2str), inputLen + 96)

        // output ProgramHash
        data.set(hexstring2ab(myProgramHash.toString()), inputLen + 104)

        // console.log( "Signature Data:", ab2hexstring(data) );
    }
    return ab2hexstring(data)
}

const hexstring2ab = str => {
    const result = []
    while (str.length >= 2) {
        result.push(parseInt(str.substring(0, 2), 16))
        str = str.substring(2, str.length)
    }
    return result
}

const ab2hexstring = arr => {
    let result = ''
    for (let i = 0; i < arr.length; i++) {
        let str = arr[i].toString(16)
        str = str.length == 0 ? '00' : str.length == 1 ? `0${str}` : str
        result += str
    }
    return result
}

const reverseArray = arr => {
    const result = new Uint8Array(arr.length)
    for (let i = 0; i < arr.length; i++) {
        result[i] = arr[arr.length - 1 - i]
    }
    return result
}

const numStoreInMemory = (num, length) => {
    for (let i = num.length; i < length; i++) {
        num = `0${num}`
    }
    return ab2hexstring(reverseArray(new Buffer(num, 'HEX')))
}

export const getInputData = ($coin, $amount) => {
    // sort
    let coinOrdered = quickSort($coin.list, 0, $coin.list - 1)

    // calc sum
    const sum = coinOrdered.reduce((sum, coin) => sum + parseFloat(coin.value), 0)

    // if sum < amount then exit;
    let amount = parseFloat($amount)
    if (sum < amount) return -1

    // find input coins
    let k = 0
    while (parseFloat(coinOrdered[k].value) <= amount) {
        amount = amount - parseFloat(coinOrdered[k].value)
        if (amount == 0) break
        k = k + 1
    }

    /////////////////////////////////////////////////////////////////////////
    // coin[0]- coin[k]
    let data = new Uint8Array(1 + 34 * (k + 1))

    // input num
    data.set(hexstring2ab(numStoreInMemory((k + 1).toString(16), 2)))

    // input coins
    for (let x = 0; x < k + 1; x++) {
        // txid
        data.set(reverseArray(hexstring2ab(coinOrdered[x].txid)), 1 + x * 34)
        //data.set(hexstring2ab(coinOrdered[x]['txid']), pos);

        // index
        //inputIndex = numStoreInMemory(coinOrdered[x]['n'].toString(16), 2);
        data.set(hexstring2ab(numStoreInMemory(coinOrdered[x].index.toString(16), 4)), 1 + x * 34 + 32)
    }

    /////////////////////////////////////////////////////////////////////////

    // calc coin_amount
    let coinAmount = 0
    for (let i = 0; i < k + 1; i++) {
        coinAmount += parseFloat(coinOrdered[i].value)
    }

    /////////////////////////////////////////////////////////////////////////

    return {
        amount: coinAmount,
        data
    }
}

const quickSort = (arr, left, right) => {
    let pivot, partitionIndex

    if (left < right) {
        pivot = right
        partitionIndex = partition(arr, pivot, left, right)

        quickSort(arr, left, partitionIndex - 1)
        quickSort(arr, partitionIndex + 1, right)
    }
    return arr
}

const partition = (arr, pivot, left, right) => {
    const pivotValue = arr[pivot]
    let partitionIndex = left

    for (let i = left; i < right; i++) {
        if (arr[i] < pivotValue) {
            swap(arr, i, partitionIndex)
            partitionIndex++
        }
    }

    swap(arr, right, partitionIndex)
    return partitionIndex
}

const swap = (arr, i, j) => {
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
}

export const signatureData = ($data, $privateKey) => {
    const elliptic = new ec('p256'),
        privateKeyHex = new Buffer($privateKey, 'hex'),
        sig = elliptic.sign(new Buffer(CryptoJS.SHA256(CryptoJS.enc.Hex.parse($data)).toString(), 'hex'), $privateKey, null),
        signature = {
            signature: Buffer.concat([sig.r.toArrayLike(Buffer, 'be', 32), sig.s.toArrayLike(Buffer, 'be', 32)])
        }
    return signature.signature.toString('hex')
}

export const addContract = ($txData, $sign, $publicKeyEncoded) => {
    const signatureScript = createSignatureScript($publicKeyEncoded)
    return `${$txData}014140${$sign}23${signatureScript}`
}

export const claimTransaction = (claims, publicKeyEncoded, toAddress, amount) => {
    let signatureScript = createSignatureScript(publicKeyEncoded)
    let myProgramHash = getHash(signatureScript)

    // Type = ClaimTransaction
    let data = '02'

    // Version is always 0 in protocol for now
    data = data + '00'

    // Transaction-specific attributes: claims

    // 1) store number of claims (txids)
    let len = claims.length
    let lenstr = numStoreInMemory(len.toString(16), 2)
    data = data + lenstr

    // 2) iterate over claim txids
    for (let k = 0; k < len; k++) {
        // get the txid
        let txid = claims[k]['txid']
        // add txid to data
        data = data + ab2hexstring(reverseArray(hexstring2ab(txid)))

        let vout = claims[k]['index'].toString(16)
        data = data + numStoreInMemory(vout, 4)
    }

    // Don't need any attributes
    data = data + '00'

    // Don't need any inputs
    data = data + '00'

    // One output for where the claim will be sent
    data = data + '01'

    // First add assetId for GAS
    data = data + ab2hexstring(reverseArray(hexstring2ab('602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7')))

    // Net add total amount of the claim
    const num1str = numStoreInMemory(amount.toString(16), 16)
    data = data + num1str

    // Finally add program hash
    data = data + myProgramHash.toString()
    // console.log(data)

    return data
}

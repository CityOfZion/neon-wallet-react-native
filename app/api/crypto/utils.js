/**
 * Reverse the elements in an array of type {Buffer}
 * @param {Buffer} input buffer
 * @returns {Buffer} A buffer in reversed order
 */
export function reverse(input) {
    let result = Buffer.alloc(input.length)
    if (result.length > 1) {
        for (let i = input.length - 1, offset = 0; i >= 0; i-- , offset++) {
            result[offset] = input[i]
        }
    } else {
        result = input
    }
    return result
}

/**
 * Bitwise XOR 2 arrays
 * @param {Buffer|string} a
 * @param {Buffer|string} b
 * @return {Buffer} a^b
 */
export function XOR(a, b) {
    if (!Buffer.isBuffer(a)) a = new Buffer(a)
    if (!Buffer.isBuffer(b)) b = new Buffer(b)
    var res = []
    for (var i = 0; i < a.length; i++) {
        res.push(a[i] ^ b[i])
    }

    return new Buffer(res)
}

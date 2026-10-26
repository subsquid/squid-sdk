const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const DIGITS = new Int8Array(128).fill(-1)
for (let i = 0; i < ALPHABET.length; i++) {
    DIGITS[ALPHABET.charCodeAt(i)] = i
}

// 58^9 is the largest power of 58 below 2^53.
const CHUNK = 9
const CHUNK_SCALE = 58n ** 9n

/**
 * The first four decoded bytes as a little-endian u32, which is the tag of a bincode enum.
 * `undefined` when `data` is not base58 or decodes to fewer bytes.
 *
 * The tag sits in the number's most significant bytes, so the whole string is decoded.
 */
export function leadingU32(data: string): number | undefined {
    // The leading '1's are zero bytes outside the number.
    let zeros = 0
    while (zeros < data.length && data[zeros] === '1') {
        zeros += 1
    }

    let number = 0n
    for (let start = zeros; start < data.length; start += CHUNK) {
        let end = Math.min(start + CHUNK, data.length)
        let value = 0
        for (let i = start; i < end; i++) {
            let digit = DIGITS[data.charCodeAt(i)] ?? -1
            if (digit < 0) return undefined
            value = value * 58 + digit
        }
        let scale = end - start === CHUNK ? CHUNK_SCALE : BigInt(58 ** (end - start))
        number = number * scale + BigInt(value)
    }

    let size = number === 0n ? 0 : Math.ceil(number.toString(16).length / 2)
    let fromNumber = 4 - Math.min(zeros, 4)
    if (size < fromNumber) return undefined

    // Big-endian; the leading zero bytes add nothing to it.
    let head = Number(number >> BigInt(8 * (size - fromNumber)))
    return swapBytes(head)
}

const SWAP = new DataView(new ArrayBuffer(4))

function swapBytes(x: number): number {
    SWAP.setUint32(0, x)
    return SWAP.getUint32(0, true)
}

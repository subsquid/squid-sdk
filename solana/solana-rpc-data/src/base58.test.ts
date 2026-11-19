import {describe, expect, it} from 'vitest'
import {leadingU32} from './base58'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function encode(bytes: number[]): string {
    let digits: number[] = []
    for (let byte of bytes) {
        let carry = byte
        for (let i = 0; i < digits.length; i++) {
            carry += digits[i] * 256
            digits[i] = carry % 58
            carry = Math.floor(carry / 58)
        }
        while (carry > 0) {
            digits.push(carry % 58)
            carry = Math.floor(carry / 58)
        }
    }

    let zeros = 0
    while (zeros < bytes.length && bytes[zeros] === 0) {
        zeros += 1
    }
    return (
        '1'.repeat(zeros) +
        digits
            .reverse()
            .map((d) => ALPHABET[d])
            .join('')
    )
}

function tagOf(bytes: number[]): number {
    return Buffer.from(bytes.slice(0, 4)).readUInt32LE(0)
}

describe('leadingU32', () => {
    it('reads the tag of encoded bytes', () => {
        let cases = [
            [3, 0, 0, 0, 0, 202, 154, 59, 0, 0, 0, 0],
            [5, 0, 0, 0, 10],
            [14, 0, 0, 0],
            [0, 0, 0, 0, 7],
            [0, 1, 0, 0, 255, 255],
            [255, 255, 255, 255, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        ]
        for (let bytes of cases) {
            expect(leadingU32(encode(bytes)), bytes.join(',')).toBe(tagOf(bytes))
        }
    })

    it('agrees with the reference on long data', () => {
        // Every length across several chunk boundaries, with and without leading zero bytes.
        for (let len = 4; len <= 300; len++) {
            for (let zeros = 0; zeros <= 5 && zeros <= len; zeros++) {
                let bytes = Array.from({length: len}, (_, i) => (i < zeros ? 0 : (i * 37 + len) & 0xff))
                expect(leadingU32(encode(bytes)), `${len} bytes, ${zeros} zeros`).toBe(tagOf(bytes))
            }
        }
    })

    it('has no tag for short or foreign data', () => {
        expect(leadingU32('')).toBeUndefined()
        expect(leadingU32(encode([2, 0, 0]))).toBeUndefined()
        expect(leadingU32('111')).toBeUndefined()
        expect(leadingU32('1111')).toBe(0)
        expect(leadingU32('3yZe7d0')).toBeUndefined()
        expect(leadingU32('3yZe7dI')).toBeUndefined()
        expect(leadingU32('3yZe7dé')).toBeUndefined()
    })
})

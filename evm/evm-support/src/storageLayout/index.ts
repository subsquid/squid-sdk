// import assert from 'assert'

// const typeBytes = new RegExp(/^bytes([0-9]*)$/)
// const typeInt = new RegExp(/^(u?int)([0-9]*)$/)
// const typeEnum = new RegExp(/^enum (.+)$/)

// // export function isPrimitive(type: string) {
// //     return (
// //         typeInt.test(type) ||
// //         typeBytes.test(type) ||
// //         typeEnum.test(type) ||
// //         type === 'bool' ||
// //         type === 'address' ||
// //         type === 'string'
// //     )
// // }

// export function uint256toHex(n: bigint): string {
//     assert(isUint256(n))
//     return '0x' + n.toString(16).padStart(64, '0')
// }

// function padKey(keyType: StorageType, key: any) {
//     if (typeInt.test(keyType.label) || typeEnum.test(keyType.label)) {
//         assert(typeof key === 'number' || typeof key === 'bigint')
//         return uint256toHex(toUint256(key, BigInt(keyType.numberOfBytes) * 8n, keyType.label[0] !== 'u'))
//     }

//     if (typeBytes.test(keyType.label)) {
//         assert(isHex(key))
//         return key
//     }

//     switch (keyType.label) {
//         case 'string':
//             return key
//         case 'address':
//             assert(isHex(key))
//             return '0x' + key.toLowerCase().slice(2).padStart(64, '0')
//         case 'bool':
//             assert(typeof key === 'boolean')
//             return uint256toHex(toUint256(BigInt(key), 1n, false))
//     }
// }

// function toUint256(n: number | bigint, width: bigint, signed: boolean): bigint {
//     if (typeof n === 'number') {
//         assert(Number.isSafeInteger(n))
//     }

//     n = BigInt(n)

//     let base = 2n ** width
//     if (signed) {
//         let min = -(2n ** (width - 1n))
//         let max = 2n ** (width - 1n) - 1n
//         assert(n >= min && n <= max)
//         n = (n + base) % base
//     }

//     assert(n < base)
//     assert(isUint256(n))

//     return n
// }

// function isUint256(value: unknown) {
//     return (
//         typeof value == 'bigint' &&
//         value >= 0 &&
//         value <= 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn
//     )
// }

// export function isHex(value: unknown): value is string {
//     return typeof value == 'string' && value.length % 2 == 0 && /^0x[A-Fa-f0-9]*$/i.test(value)
// }

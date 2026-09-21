import { address, bytes, uint256 } from '@subsquid/evm-codec'
import { event, indexed } from '../abi.support.js'
import type { EventParams as EParams } from '../abi.support.js'

// Transfer(address,address,uint256,address,bytes,bytes)
export const Transfer_0 = event('0x8988d59efc2c4547ef86c88f6543963bab0cea94f8e486e619c7c3a790db93be', {
    from: indexed(address),
    to: indexed(address),
    tokenId: indexed(uint256),
    operator: address,
    userData: bytes,
    operatorData: bytes,
})
export type TransferEventArgs_0 = EParams<typeof Transfer_0>

// Transfer(address,address,uint256,address,bytes)
export const Transfer_1 = event('0xd5c97f2e041b2046be3b4337472f05720760a198f4d7d84980b7155eec7cca6f', {
    from: indexed(address),
    to: indexed(address),
    tokenId: indexed(uint256),
    operator: address,
    userData: bytes,
})
export type TransferEventArgs_1 = EParams<typeof Transfer_1>

// Transfer(address,address,uint256)
export const Transfer_2 = event('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', {
    from: indexed(address),
    to: indexed(address),
    tokenId: indexed(uint256),
})
export type TransferEventArgs_2 = EParams<typeof Transfer_2>

// Transfer(address,address,uint256)
export const Transfer_3 = event('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', {
    from: indexed(address),
    to: indexed(address),
    tokenId: uint256,
})
export type TransferEventArgs_3 = EParams<typeof Transfer_3>

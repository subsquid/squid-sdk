import { address, uint256 } from '@subsquid/evm-codec'
import { event, indexed } from '../abi.support.js'
import type { EventParams as EParams } from '../abi.support.js'

// DestroyedBlackFunds(address,uint256)
export const DestroyedBlackFunds = event('0x61e6e66b0d6339b2980aecc6ccc0039736791f0ccde9ed512e789a7fbdd698c6', {
    _blackListedUser: indexed(address),
    _balance: uint256,
})
export type DestroyedBlackFundsEventArgs = EParams<typeof DestroyedBlackFunds>

// Issue(uint256)
export const Issue = event('0xcb8241adb0c3fdb35b70c24ce35c5eb0c17af7431c99f827d44a445ca624176a', {
    amount: uint256,
})
export type IssueEventArgs = EParams<typeof Issue>

// Redeem(uint256)
export const Redeem = event('0x702d5967f45f6513a38ffc42d6ba9bf230bd40e8f53b16363c7eb4fd2deb9a44', {
    amount: uint256,
})
export type RedeemEventArgs = EParams<typeof Redeem>

// Deprecate(address)
export const Deprecate = event('0xcc358699805e9a8b7f77b522628c7cb9abd07d9efb86b6fb616af1609036a99e', {
    newAddress: address,
})
export type DeprecateEventArgs = EParams<typeof Deprecate>

// AddedBlackList(address)
export const AddedBlackList = event('0x42e160154868087d6bfdc0ca23d96a1c1cfa32f1b72ba9ba27b69b98a0d819dc', {
    _user: indexed(address),
})
export type AddedBlackListEventArgs = EParams<typeof AddedBlackList>

// RemovedBlackList(address)
export const RemovedBlackList = event('0xd7e9ec6e6ecd65492dce6bf513cd6867560d49544421d0783ddf06e76c24470c', {
    _user: indexed(address),
})
export type RemovedBlackListEventArgs = EParams<typeof RemovedBlackList>

// Params(uint256,uint256)
export const Params = event('0xb044a1e409eac5c48e5af22d4af52670dd1a99059537a78b31b48c6500a6354e', {
    feeBasisPoints: uint256,
    maxFee: uint256,
})
export type ParamsEventArgs = EParams<typeof Params>

// Pause()
export const Pause = event('0x6985a02210a168e66602d3235cb6db0e70f92b3ba4d376a33c0f3d9434bff625', {})
export type PauseEventArgs = EParams<typeof Pause>

// Unpause()
export const Unpause = event('0x7805862f689e2f13df9f062ff482ad3ad112aca9e0847911ed832e158c525b33', {})
export type UnpauseEventArgs = EParams<typeof Unpause>

// OwnershipTransferred(address,address)
export const OwnershipTransferred = event('0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0', {
    previousOwner: indexed(address),
    newOwner: indexed(address),
})
export type OwnershipTransferredEventArgs = EParams<typeof OwnershipTransferred>

// Approval(address,address,uint256)
export const Approval = event('0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', {
    owner: indexed(address),
    spender: indexed(address),
    value: uint256,
})
export type ApprovalEventArgs = EParams<typeof Approval>

// Transfer(address,address,uint256)
export const Transfer = event('0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', {
    from: indexed(address),
    to: indexed(address),
    value: uint256,
})
export type TransferEventArgs = EParams<typeof Transfer>

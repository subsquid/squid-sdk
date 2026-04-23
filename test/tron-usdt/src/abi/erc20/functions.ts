import { address, bool, string, struct, uint256, uint8 } from '@subsquid/evm-codec'
import { fun, viewFun } from '../abi.support.js'
import type { FunctionArguments, FunctionReturn } from '../abi.support.js'

// name()
export const name = viewFun('0x06fdde03', struct({}), string)
export type NameParams = FunctionArguments<typeof name>
export type NameReturn = FunctionReturn<typeof name>

// deprecate(address)
export const deprecate = fun('0x0753c30c', struct({
    _upgradedAddress: address,
}))
export type DeprecateParams = FunctionArguments<typeof deprecate>
export type DeprecateReturn = FunctionReturn<typeof deprecate>

// approve(address,uint256)
export const approve = fun('0x095ea7b3', struct({
    _spender: address,
    _value: uint256,
}), bool)
export type ApproveParams = FunctionArguments<typeof approve>
export type ApproveReturn = FunctionReturn<typeof approve>

// deprecated()
export const deprecated = viewFun('0x0e136b19', struct({}), bool)
export type DeprecatedParams = FunctionArguments<typeof deprecated>
export type DeprecatedReturn = FunctionReturn<typeof deprecated>

// addBlackList(address)
export const addBlackList = fun('0x0ecb93c0', struct({
    _evilUser: address,
}))
export type AddBlackListParams = FunctionArguments<typeof addBlackList>
export type AddBlackListReturn = FunctionReturn<typeof addBlackList>

// totalSupply()
export const totalSupply = viewFun('0x18160ddd', struct({}), uint256)
export type TotalSupplyParams = FunctionArguments<typeof totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof totalSupply>

// transferFrom(address,address,uint256)
export const transferFrom = fun('0x23b872dd', struct({
    _from: address,
    _to: address,
    _value: uint256,
}), bool)
export type TransferFromParams = FunctionArguments<typeof transferFrom>
export type TransferFromReturn = FunctionReturn<typeof transferFrom>

// upgradedAddress()
export const upgradedAddress = viewFun('0x26976e3f', struct({}), address)
export type UpgradedAddressParams = FunctionArguments<typeof upgradedAddress>
export type UpgradedAddressReturn = FunctionReturn<typeof upgradedAddress>

// decimals()
export const decimals = viewFun('0x313ce567', struct({}), uint8)
export type DecimalsParams = FunctionArguments<typeof decimals>
export type DecimalsReturn = FunctionReturn<typeof decimals>

// maximumFee()
export const maximumFee = viewFun('0x35390714', struct({}), uint256)
export type MaximumFeeParams = FunctionArguments<typeof maximumFee>
export type MaximumFeeReturn = FunctionReturn<typeof maximumFee>

// _totalSupply()
export const _totalSupply = viewFun('0x3eaaf86b', struct({}), uint256)
export type _totalSupplyParams = FunctionArguments<typeof _totalSupply>
export type _totalSupplyReturn = FunctionReturn<typeof _totalSupply>

// unpause()
export const unpause = fun('0x3f4ba83a', struct({}))
export type UnpauseParams = FunctionArguments<typeof unpause>
export type UnpauseReturn = FunctionReturn<typeof unpause>

// getBlackListStatus(address)
export const getBlackListStatus = viewFun('0x59bf1abe', struct({
    _maker: address,
}), bool)
export type GetBlackListStatusParams = FunctionArguments<typeof getBlackListStatus>
export type GetBlackListStatusReturn = FunctionReturn<typeof getBlackListStatus>

// paused()
export const paused = viewFun('0x5c975abb', struct({}), bool)
export type PausedParams = FunctionArguments<typeof paused>
export type PausedReturn = FunctionReturn<typeof paused>

// decreaseApproval(address,uint256)
export const decreaseApproval = fun('0x66188463', struct({
    _spender: address,
    _subtractedValue: uint256,
}), bool)
export type DecreaseApprovalParams = FunctionArguments<typeof decreaseApproval>
export type DecreaseApprovalReturn = FunctionReturn<typeof decreaseApproval>

// balanceOf(address)
export const balanceOf = viewFun('0x70a08231', struct({
    who: address,
}), uint256)
export type BalanceOfParams = FunctionArguments<typeof balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof balanceOf>

// calcFee(uint256)
export const calcFee = viewFun('0x75dc7d8c', struct({
    _value: uint256,
}), uint256)
export type CalcFeeParams = FunctionArguments<typeof calcFee>
export type CalcFeeReturn = FunctionReturn<typeof calcFee>

// pause()
export const pause = fun('0x8456cb59', struct({}))
export type PauseParams = FunctionArguments<typeof pause>
export type PauseReturn = FunctionReturn<typeof pause>

// owner()
export const owner = viewFun('0x8da5cb5b', struct({}), address)
export type OwnerParams = FunctionArguments<typeof owner>
export type OwnerReturn = FunctionReturn<typeof owner>

// symbol()
export const symbol = viewFun('0x95d89b41', struct({}), string)
export type SymbolParams = FunctionArguments<typeof symbol>
export type SymbolReturn = FunctionReturn<typeof symbol>

// transfer(address,uint256)
export const transfer = fun('0xa9059cbb', struct({
    _to: address,
    _value: uint256,
}), bool)
export type TransferParams = FunctionArguments<typeof transfer>
export type TransferReturn = FunctionReturn<typeof transfer>

// oldBalanceOf(address)
export const oldBalanceOf = viewFun('0xb7a3446c', struct({
    who: address,
}), uint256)
export type OldBalanceOfParams = FunctionArguments<typeof oldBalanceOf>
export type OldBalanceOfReturn = FunctionReturn<typeof oldBalanceOf>

// setParams(uint256,uint256)
export const setParams = fun('0xc0324c77', struct({
    newBasisPoints: uint256,
    newMaxFee: uint256,
}))
export type SetParamsParams = FunctionArguments<typeof setParams>
export type SetParamsReturn = FunctionReturn<typeof setParams>

// issue(uint256)
export const issue = fun('0xcc872b66', struct({
    amount: uint256,
}))
export type IssueParams = FunctionArguments<typeof issue>
export type IssueReturn = FunctionReturn<typeof issue>

// increaseApproval(address,uint256)
export const increaseApproval = fun('0xd73dd623', struct({
    _spender: address,
    _addedValue: uint256,
}), bool)
export type IncreaseApprovalParams = FunctionArguments<typeof increaseApproval>
export type IncreaseApprovalReturn = FunctionReturn<typeof increaseApproval>

// redeem(uint256)
export const redeem = fun('0xdb006a75', struct({
    amount: uint256,
}))
export type RedeemParams = FunctionArguments<typeof redeem>
export type RedeemReturn = FunctionReturn<typeof redeem>

// allowance(address,address)
export const allowance = viewFun('0xdd62ed3e', struct({
    _owner: address,
    _spender: address,
}), uint256)
export type AllowanceParams = FunctionArguments<typeof allowance>
export type AllowanceReturn = FunctionReturn<typeof allowance>

// basisPointsRate()
export const basisPointsRate = viewFun('0xdd644f72', struct({}), uint256)
export type BasisPointsRateParams = FunctionArguments<typeof basisPointsRate>
export type BasisPointsRateReturn = FunctionReturn<typeof basisPointsRate>

// isBlackListed(address)
export const isBlackListed = viewFun('0xe47d6060', struct({
    _0: address,
}), bool)
export type IsBlackListedParams = FunctionArguments<typeof isBlackListed>
export type IsBlackListedReturn = FunctionReturn<typeof isBlackListed>

// removeBlackList(address)
export const removeBlackList = fun('0xe4997dc5', struct({
    _clearedUser: address,
}))
export type RemoveBlackListParams = FunctionArguments<typeof removeBlackList>
export type RemoveBlackListReturn = FunctionReturn<typeof removeBlackList>

// MAX_UINT()
export const MAX_UINT = viewFun('0xe5b5019a', struct({}), uint256)
export type MAX_UINTParams = FunctionArguments<typeof MAX_UINT>
export type MAX_UINTReturn = FunctionReturn<typeof MAX_UINT>

// transferOwnership(address)
export const transferOwnership = fun('0xf2fde38b', struct({
    newOwner: address,
}))
export type TransferOwnershipParams = FunctionArguments<typeof transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof transferOwnership>

// destroyBlackFunds(address)
export const destroyBlackFunds = fun('0xf3bdc228', struct({
    _blackListedUser: address,
}))
export type DestroyBlackFundsParams = FunctionArguments<typeof destroyBlackFunds>
export type DestroyBlackFundsReturn = FunctionReturn<typeof destroyBlackFunds>

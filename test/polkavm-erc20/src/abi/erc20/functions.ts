import { address, bool, string, uint256, uint8 } from '@subsquid/evm-codec'
import { fun, viewFun } from '../abi.support.js'
import type { FunctionArguments, FunctionReturn } from '../abi.support.js'

// name()
export const name = viewFun('0x06fdde03', {}, string)
export type NameParams = FunctionArguments<typeof name>
export type NameReturn = FunctionReturn<typeof name>

// approve(address,uint256)
export const approve = fun('0x095ea7b3', {
    _spender: address,
    _value: uint256,
}, bool)
export type ApproveParams = FunctionArguments<typeof approve>
export type ApproveReturn = FunctionReturn<typeof approve>

// totalSupply()
export const totalSupply = viewFun('0x18160ddd', {}, uint256)
export type TotalSupplyParams = FunctionArguments<typeof totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof totalSupply>

// transferFrom(address,address,uint256)
export const transferFrom = fun('0x23b872dd', {
    _from: address,
    _to: address,
    _value: uint256,
}, bool)
export type TransferFromParams = FunctionArguments<typeof transferFrom>
export type TransferFromReturn = FunctionReturn<typeof transferFrom>

// decimals()
export const decimals = viewFun('0x313ce567', {}, uint8)
export type DecimalsParams = FunctionArguments<typeof decimals>
export type DecimalsReturn = FunctionReturn<typeof decimals>

// balanceOf(address)
export const balanceOf = viewFun('0x70a08231', {
    _owner: address,
}, uint256)
export type BalanceOfParams = FunctionArguments<typeof balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof balanceOf>

// symbol()
export const symbol = viewFun('0x95d89b41', {}, string)
export type SymbolParams = FunctionArguments<typeof symbol>
export type SymbolReturn = FunctionReturn<typeof symbol>

// transfer(address,uint256)
export const transfer = fun('0xa9059cbb', {
    _to: address,
    _value: uint256,
}, bool)
export type TransferParams = FunctionArguments<typeof transfer>
export type TransferReturn = FunctionReturn<typeof transfer>

// allowance(address,address)
export const allowance = viewFun('0xdd62ed3e', {
    _owner: address,
    _spender: address,
}, uint256)
export type AllowanceParams = FunctionArguments<typeof allowance>
export type AllowanceReturn = FunctionReturn<typeof allowance>

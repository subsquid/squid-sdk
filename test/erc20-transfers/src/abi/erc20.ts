import * as p from '@subsquid/evm-codec'
import { event, fun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    Approval: event("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", {"owner": indexed(p.address), "spender": indexed(p.address), "value": p.uint256}),
    Transfer: event("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", {"from": indexed(p.address), "to": indexed(p.address), "value": p.uint256}),
}

export const functions = {
    name: fun("0x06fdde03", {}, p.string),
    approve: fun("0x095ea7b3", {"_spender": p.address, "_value": p.uint256}, p.bool),
    totalSupply: fun("0x18160ddd", {}, p.uint256),
    transferFrom: fun("0x23b872dd", {"_from": p.address, "_to": p.address, "_value": p.uint256}, p.bool),
    decimals: fun("0x313ce567", {}, p.uint8),
    balanceOf: fun("0x70a08231", {"_owner": p.address}, p.uint256),
    symbol: fun("0x95d89b41", {}, p.string),
    transfer: fun("0xa9059cbb", {"_to": p.address, "_value": p.uint256}, p.bool),
    allowance: fun("0xdd62ed3e", {"_owner": p.address, "_spender": p.address}, p.uint256),
}

export class Contract extends ContractBase {

    name() {
        return this.eth_call(functions.name, {})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }

    decimals() {
        return this.eth_call(functions.decimals, {})
    }

    balanceOf(_owner: BalanceOfParams["_owner"]) {
        return this.eth_call(functions.balanceOf, {_owner})
    }

    symbol() {
        return this.eth_call(functions.symbol, {})
    }

    allowance(_owner: AllowanceParams["_owner"], _spender: AllowanceParams["_spender"]) {
        return this.eth_call(functions.allowance, {_owner, _spender})
    }
}

/// Event types
export type ApprovalEventArgs = EParams<typeof events.Approval>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type NameParams = FunctionArguments<typeof functions.name>
export type NameReturn = FunctionReturn<typeof functions.name>

export type ApproveParams = FunctionArguments<typeof functions.approve>
export type ApproveReturn = FunctionReturn<typeof functions.approve>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferFromParams = FunctionArguments<typeof functions.transferFrom>
export type TransferFromReturn = FunctionReturn<typeof functions.transferFrom>

export type DecimalsParams = FunctionArguments<typeof functions.decimals>
export type DecimalsReturn = FunctionReturn<typeof functions.decimals>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type SymbolParams = FunctionArguments<typeof functions.symbol>
export type SymbolReturn = FunctionReturn<typeof functions.symbol>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type AllowanceParams = FunctionArguments<typeof functions.allowance>
export type AllowanceReturn = FunctionReturn<typeof functions.allowance>


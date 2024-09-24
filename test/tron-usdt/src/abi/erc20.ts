import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    DestroyedBlackFunds: event("0x61e6e66b0d6339b2980aecc6ccc0039736791f0ccde9ed512e789a7fbdd698c6", "DestroyedBlackFunds(address,uint256)", {"_blackListedUser": indexed(p.address), "_balance": p.uint256}),
    Issue: event("0xcb8241adb0c3fdb35b70c24ce35c5eb0c17af7431c99f827d44a445ca624176a", "Issue(uint256)", {"amount": p.uint256}),
    Redeem: event("0x702d5967f45f6513a38ffc42d6ba9bf230bd40e8f53b16363c7eb4fd2deb9a44", "Redeem(uint256)", {"amount": p.uint256}),
    Deprecate: event("0xcc358699805e9a8b7f77b522628c7cb9abd07d9efb86b6fb616af1609036a99e", "Deprecate(address)", {"newAddress": p.address}),
    AddedBlackList: event("0x42e160154868087d6bfdc0ca23d96a1c1cfa32f1b72ba9ba27b69b98a0d819dc", "AddedBlackList(address)", {"_user": indexed(p.address)}),
    RemovedBlackList: event("0xd7e9ec6e6ecd65492dce6bf513cd6867560d49544421d0783ddf06e76c24470c", "RemovedBlackList(address)", {"_user": indexed(p.address)}),
    Params: event("0xb044a1e409eac5c48e5af22d4af52670dd1a99059537a78b31b48c6500a6354e", "Params(uint256,uint256)", {"feeBasisPoints": p.uint256, "maxFee": p.uint256}),
    Pause: event("0x6985a02210a168e66602d3235cb6db0e70f92b3ba4d376a33c0f3d9434bff625", "Pause()", {}),
    Unpause: event("0x7805862f689e2f13df9f062ff482ad3ad112aca9e0847911ed832e158c525b33", "Unpause()", {}),
    OwnershipTransferred: event("0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0", "OwnershipTransferred(address,address)", {"previousOwner": indexed(p.address), "newOwner": indexed(p.address)}),
    Approval: event("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", "Approval(address,address,uint256)", {"owner": indexed(p.address), "spender": indexed(p.address), "value": p.uint256}),
    Transfer: event("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", "Transfer(address,address,uint256)", {"from": indexed(p.address), "to": indexed(p.address), "value": p.uint256}),
}

export const functions = {
    name: viewFun("0x06fdde03", "name()", {}, p.string),
    deprecate: fun("0x0753c30c", "deprecate(address)", {"_upgradedAddress": p.address}, ),
    approve: fun("0x095ea7b3", "approve(address,uint256)", {"_spender": p.address, "_value": p.uint256}, p.bool),
    deprecated: viewFun("0x0e136b19", "deprecated()", {}, p.bool),
    addBlackList: fun("0x0ecb93c0", "addBlackList(address)", {"_evilUser": p.address}, ),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transferFrom: fun("0x23b872dd", "transferFrom(address,address,uint256)", {"_from": p.address, "_to": p.address, "_value": p.uint256}, p.bool),
    upgradedAddress: viewFun("0x26976e3f", "upgradedAddress()", {}, p.address),
    decimals: viewFun("0x313ce567", "decimals()", {}, p.uint8),
    maximumFee: viewFun("0x35390714", "maximumFee()", {}, p.uint256),
    _totalSupply: viewFun("0x3eaaf86b", "_totalSupply()", {}, p.uint256),
    unpause: fun("0x3f4ba83a", "unpause()", {}, ),
    getBlackListStatus: viewFun("0x59bf1abe", "getBlackListStatus(address)", {"_maker": p.address}, p.bool),
    paused: viewFun("0x5c975abb", "paused()", {}, p.bool),
    decreaseApproval: fun("0x66188463", "decreaseApproval(address,uint256)", {"_spender": p.address, "_subtractedValue": p.uint256}, p.bool),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"who": p.address}, p.uint256),
    calcFee: viewFun("0x75dc7d8c", "calcFee(uint256)", {"_value": p.uint256}, p.uint256),
    pause: fun("0x8456cb59", "pause()", {}, ),
    owner: viewFun("0x8da5cb5b", "owner()", {}, p.address),
    symbol: viewFun("0x95d89b41", "symbol()", {}, p.string),
    transfer: fun("0xa9059cbb", "transfer(address,uint256)", {"_to": p.address, "_value": p.uint256}, p.bool),
    oldBalanceOf: viewFun("0xb7a3446c", "oldBalanceOf(address)", {"who": p.address}, p.uint256),
    setParams: fun("0xc0324c77", "setParams(uint256,uint256)", {"newBasisPoints": p.uint256, "newMaxFee": p.uint256}, ),
    issue: fun("0xcc872b66", "issue(uint256)", {"amount": p.uint256}, ),
    increaseApproval: fun("0xd73dd623", "increaseApproval(address,uint256)", {"_spender": p.address, "_addedValue": p.uint256}, p.bool),
    redeem: fun("0xdb006a75", "redeem(uint256)", {"amount": p.uint256}, ),
    allowance: viewFun("0xdd62ed3e", "allowance(address,address)", {"_owner": p.address, "_spender": p.address}, p.uint256),
    basisPointsRate: viewFun("0xdd644f72", "basisPointsRate()", {}, p.uint256),
    isBlackListed: viewFun("0xe47d6060", "isBlackListed(address)", {"_0": p.address}, p.bool),
    removeBlackList: fun("0xe4997dc5", "removeBlackList(address)", {"_clearedUser": p.address}, ),
    MAX_UINT: viewFun("0xe5b5019a", "MAX_UINT()", {}, p.uint256),
    transferOwnership: fun("0xf2fde38b", "transferOwnership(address)", {"newOwner": p.address}, ),
    destroyBlackFunds: fun("0xf3bdc228", "destroyBlackFunds(address)", {"_blackListedUser": p.address}, ),
}

export class Contract extends ContractBase {

    name() {
        return this.eth_call(functions.name, {})
    }

    deprecated() {
        return this.eth_call(functions.deprecated, {})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }

    upgradedAddress() {
        return this.eth_call(functions.upgradedAddress, {})
    }

    decimals() {
        return this.eth_call(functions.decimals, {})
    }

    maximumFee() {
        return this.eth_call(functions.maximumFee, {})
    }

    _totalSupply() {
        return this.eth_call(functions._totalSupply, {})
    }

    getBlackListStatus(_maker: GetBlackListStatusParams["_maker"]) {
        return this.eth_call(functions.getBlackListStatus, {_maker})
    }

    paused() {
        return this.eth_call(functions.paused, {})
    }

    balanceOf(who: BalanceOfParams["who"]) {
        return this.eth_call(functions.balanceOf, {who})
    }

    calcFee(_value: CalcFeeParams["_value"]) {
        return this.eth_call(functions.calcFee, {_value})
    }

    owner() {
        return this.eth_call(functions.owner, {})
    }

    symbol() {
        return this.eth_call(functions.symbol, {})
    }

    oldBalanceOf(who: OldBalanceOfParams["who"]) {
        return this.eth_call(functions.oldBalanceOf, {who})
    }

    allowance(_owner: AllowanceParams["_owner"], _spender: AllowanceParams["_spender"]) {
        return this.eth_call(functions.allowance, {_owner, _spender})
    }

    basisPointsRate() {
        return this.eth_call(functions.basisPointsRate, {})
    }

    isBlackListed(_0: IsBlackListedParams["_0"]) {
        return this.eth_call(functions.isBlackListed, {_0})
    }

    MAX_UINT() {
        return this.eth_call(functions.MAX_UINT, {})
    }
}

/// Event types
export type DestroyedBlackFundsEventArgs = EParams<typeof events.DestroyedBlackFunds>
export type IssueEventArgs = EParams<typeof events.Issue>
export type RedeemEventArgs = EParams<typeof events.Redeem>
export type DeprecateEventArgs = EParams<typeof events.Deprecate>
export type AddedBlackListEventArgs = EParams<typeof events.AddedBlackList>
export type RemovedBlackListEventArgs = EParams<typeof events.RemovedBlackList>
export type ParamsEventArgs = EParams<typeof events.Params>
export type PauseEventArgs = EParams<typeof events.Pause>
export type UnpauseEventArgs = EParams<typeof events.Unpause>
export type OwnershipTransferredEventArgs = EParams<typeof events.OwnershipTransferred>
export type ApprovalEventArgs = EParams<typeof events.Approval>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type NameParams = FunctionArguments<typeof functions.name>
export type NameReturn = FunctionReturn<typeof functions.name>

export type DeprecateParams = FunctionArguments<typeof functions.deprecate>
export type DeprecateReturn = FunctionReturn<typeof functions.deprecate>

export type ApproveParams = FunctionArguments<typeof functions.approve>
export type ApproveReturn = FunctionReturn<typeof functions.approve>

export type DeprecatedParams = FunctionArguments<typeof functions.deprecated>
export type DeprecatedReturn = FunctionReturn<typeof functions.deprecated>

export type AddBlackListParams = FunctionArguments<typeof functions.addBlackList>
export type AddBlackListReturn = FunctionReturn<typeof functions.addBlackList>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferFromParams = FunctionArguments<typeof functions.transferFrom>
export type TransferFromReturn = FunctionReturn<typeof functions.transferFrom>

export type UpgradedAddressParams = FunctionArguments<typeof functions.upgradedAddress>
export type UpgradedAddressReturn = FunctionReturn<typeof functions.upgradedAddress>

export type DecimalsParams = FunctionArguments<typeof functions.decimals>
export type DecimalsReturn = FunctionReturn<typeof functions.decimals>

export type MaximumFeeParams = FunctionArguments<typeof functions.maximumFee>
export type MaximumFeeReturn = FunctionReturn<typeof functions.maximumFee>

export type _totalSupplyParams = FunctionArguments<typeof functions._totalSupply>
export type _totalSupplyReturn = FunctionReturn<typeof functions._totalSupply>

export type UnpauseParams = FunctionArguments<typeof functions.unpause>
export type UnpauseReturn = FunctionReturn<typeof functions.unpause>

export type GetBlackListStatusParams = FunctionArguments<typeof functions.getBlackListStatus>
export type GetBlackListStatusReturn = FunctionReturn<typeof functions.getBlackListStatus>

export type PausedParams = FunctionArguments<typeof functions.paused>
export type PausedReturn = FunctionReturn<typeof functions.paused>

export type DecreaseApprovalParams = FunctionArguments<typeof functions.decreaseApproval>
export type DecreaseApprovalReturn = FunctionReturn<typeof functions.decreaseApproval>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type CalcFeeParams = FunctionArguments<typeof functions.calcFee>
export type CalcFeeReturn = FunctionReturn<typeof functions.calcFee>

export type PauseParams = FunctionArguments<typeof functions.pause>
export type PauseReturn = FunctionReturn<typeof functions.pause>

export type OwnerParams = FunctionArguments<typeof functions.owner>
export type OwnerReturn = FunctionReturn<typeof functions.owner>

export type SymbolParams = FunctionArguments<typeof functions.symbol>
export type SymbolReturn = FunctionReturn<typeof functions.symbol>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type OldBalanceOfParams = FunctionArguments<typeof functions.oldBalanceOf>
export type OldBalanceOfReturn = FunctionReturn<typeof functions.oldBalanceOf>

export type SetParamsParams = FunctionArguments<typeof functions.setParams>
export type SetParamsReturn = FunctionReturn<typeof functions.setParams>

export type IssueParams = FunctionArguments<typeof functions.issue>
export type IssueReturn = FunctionReturn<typeof functions.issue>

export type IncreaseApprovalParams = FunctionArguments<typeof functions.increaseApproval>
export type IncreaseApprovalReturn = FunctionReturn<typeof functions.increaseApproval>

export type RedeemParams = FunctionArguments<typeof functions.redeem>
export type RedeemReturn = FunctionReturn<typeof functions.redeem>

export type AllowanceParams = FunctionArguments<typeof functions.allowance>
export type AllowanceReturn = FunctionReturn<typeof functions.allowance>

export type BasisPointsRateParams = FunctionArguments<typeof functions.basisPointsRate>
export type BasisPointsRateReturn = FunctionReturn<typeof functions.basisPointsRate>

export type IsBlackListedParams = FunctionArguments<typeof functions.isBlackListed>
export type IsBlackListedReturn = FunctionReturn<typeof functions.isBlackListed>

export type RemoveBlackListParams = FunctionArguments<typeof functions.removeBlackList>
export type RemoveBlackListReturn = FunctionReturn<typeof functions.removeBlackList>

export type MAX_UINTParams = FunctionArguments<typeof functions.MAX_UINT>
export type MAX_UINTReturn = FunctionReturn<typeof functions.MAX_UINT>

export type TransferOwnershipParams = FunctionArguments<typeof functions.transferOwnership>
export type TransferOwnershipReturn = FunctionReturn<typeof functions.transferOwnership>

export type DestroyBlackFundsParams = FunctionArguments<typeof functions.destroyBlackFunds>
export type DestroyBlackFundsReturn = FunctionReturn<typeof functions.destroyBlackFunds>


import * as p from '@subsquid/evm-codec'
import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'
import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'

export const events = {
    Approval: event("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", "Approval(address,address,uint256)", {"owner": indexed(p.address), "spender": indexed(p.address), "value": p.uint256}),
    Burn: event("0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496", "Burn(address,uint256,uint256,address)", {"sender": indexed(p.address), "amount0": p.uint256, "amount1": p.uint256, "to": indexed(p.address)}),
    Mint: event("0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f", "Mint(address,uint256,uint256)", {"sender": indexed(p.address), "amount0": p.uint256, "amount1": p.uint256}),
    Swap: event("0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822", "Swap(address,uint256,uint256,uint256,uint256,address)", {"sender": indexed(p.address), "amount0In": p.uint256, "amount1In": p.uint256, "amount0Out": p.uint256, "amount1Out": p.uint256, "to": indexed(p.address)}),
    Sync: event("0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1", "Sync(uint112,uint112)", {"reserve0": p.uint112, "reserve1": p.uint112}),
    Transfer: event("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", "Transfer(address,address,uint256)", {"from": indexed(p.address), "to": indexed(p.address), "value": p.uint256}),
}

export const functions = {
    DOMAIN_SEPARATOR: viewFun("0x3644e515", "DOMAIN_SEPARATOR()", {}, p.bytes32),
    MINIMUM_LIQUIDITY: viewFun("0xba9a7a56", "MINIMUM_LIQUIDITY()", {}, p.uint256),
    PERMIT_TYPEHASH: viewFun("0x30adf81f", "PERMIT_TYPEHASH()", {}, p.bytes32),
    allowance: viewFun("0xdd62ed3e", "allowance(address,address)", {"owner": p.address, "spender": p.address}, p.uint256),
    approve: fun("0x095ea7b3", "approve(address,uint256)", {"spender": p.address, "value": p.uint256}, p.bool),
    balanceOf: viewFun("0x70a08231", "balanceOf(address)", {"owner": p.address}, p.uint256),
    burn: fun("0x89afcb44", "burn(address)", {"to": p.address}, {"amount0": p.uint256, "amount1": p.uint256}),
    decimals: viewFun("0x313ce567", "decimals()", {}, p.uint8),
    factory: viewFun("0xc45a0155", "factory()", {}, p.address),
    getReserves: viewFun("0x0902f1ac", "getReserves()", {}, {"reserve0": p.uint112, "reserve1": p.uint112, "blockTimestampLast": p.uint32}),
    initialize: fun("0x485cc955", "initialize(address,address)", {"_0": p.address, "_1": p.address}, ),
    kLast: viewFun("0x7464fc3d", "kLast()", {}, p.uint256),
    mint: fun("0x6a627842", "mint(address)", {"to": p.address}, p.uint256),
    name: viewFun("0x06fdde03", "name()", {}, p.string),
    nonces: viewFun("0x7ecebe00", "nonces(address)", {"owner": p.address}, p.uint256),
    permit: fun("0xd505accf", "permit(address,address,uint256,uint256,uint8,bytes32,bytes32)", {"owner": p.address, "spender": p.address, "value": p.uint256, "deadline": p.uint256, "v": p.uint8, "r": p.bytes32, "s": p.bytes32}, ),
    price0CumulativeLast: viewFun("0x5909c0d5", "price0CumulativeLast()", {}, p.uint256),
    price1CumulativeLast: viewFun("0x5a3d5493", "price1CumulativeLast()", {}, p.uint256),
    skim: fun("0xbc25cf77", "skim(address)", {"to": p.address}, ),
    swap: fun("0x022c0d9f", "swap(uint256,uint256,address,bytes)", {"amount0Out": p.uint256, "amount1Out": p.uint256, "to": p.address, "data": p.bytes}, ),
    symbol: viewFun("0x95d89b41", "symbol()", {}, p.string),
    sync: fun("0xfff6cae9", "sync()", {}, ),
    token0: viewFun("0x0dfe1681", "token0()", {}, p.address),
    token1: viewFun("0xd21220a7", "token1()", {}, p.address),
    totalSupply: viewFun("0x18160ddd", "totalSupply()", {}, p.uint256),
    transfer: fun("0xa9059cbb", "transfer(address,uint256)", {"to": p.address, "value": p.uint256}, p.bool),
    transferFrom: fun("0x23b872dd", "transferFrom(address,address,uint256)", {"from": p.address, "to": p.address, "value": p.uint256}, p.bool),
}

export class Contract extends ContractBase {

    DOMAIN_SEPARATOR() {
        return this.eth_call(functions.DOMAIN_SEPARATOR, {})
    }

    MINIMUM_LIQUIDITY() {
        return this.eth_call(functions.MINIMUM_LIQUIDITY, {})
    }

    PERMIT_TYPEHASH() {
        return this.eth_call(functions.PERMIT_TYPEHASH, {})
    }

    allowance(owner: AllowanceParams["owner"], spender: AllowanceParams["spender"]) {
        return this.eth_call(functions.allowance, {owner, spender})
    }

    balanceOf(owner: BalanceOfParams["owner"]) {
        return this.eth_call(functions.balanceOf, {owner})
    }

    decimals() {
        return this.eth_call(functions.decimals, {})
    }

    factory() {
        return this.eth_call(functions.factory, {})
    }

    getReserves() {
        return this.eth_call(functions.getReserves, {})
    }

    kLast() {
        return this.eth_call(functions.kLast, {})
    }

    name() {
        return this.eth_call(functions.name, {})
    }

    nonces(owner: NoncesParams["owner"]) {
        return this.eth_call(functions.nonces, {owner})
    }

    price0CumulativeLast() {
        return this.eth_call(functions.price0CumulativeLast, {})
    }

    price1CumulativeLast() {
        return this.eth_call(functions.price1CumulativeLast, {})
    }

    symbol() {
        return this.eth_call(functions.symbol, {})
    }

    token0() {
        return this.eth_call(functions.token0, {})
    }

    token1() {
        return this.eth_call(functions.token1, {})
    }

    totalSupply() {
        return this.eth_call(functions.totalSupply, {})
    }
}

/// Event types
export type ApprovalEventArgs = EParams<typeof events.Approval>
export type BurnEventArgs = EParams<typeof events.Burn>
export type MintEventArgs = EParams<typeof events.Mint>
export type SwapEventArgs = EParams<typeof events.Swap>
export type SyncEventArgs = EParams<typeof events.Sync>
export type TransferEventArgs = EParams<typeof events.Transfer>

/// Function types
export type DOMAIN_SEPARATORParams = FunctionArguments<typeof functions.DOMAIN_SEPARATOR>
export type DOMAIN_SEPARATORReturn = FunctionReturn<typeof functions.DOMAIN_SEPARATOR>

export type MINIMUM_LIQUIDITYParams = FunctionArguments<typeof functions.MINIMUM_LIQUIDITY>
export type MINIMUM_LIQUIDITYReturn = FunctionReturn<typeof functions.MINIMUM_LIQUIDITY>

export type PERMIT_TYPEHASHParams = FunctionArguments<typeof functions.PERMIT_TYPEHASH>
export type PERMIT_TYPEHASHReturn = FunctionReturn<typeof functions.PERMIT_TYPEHASH>

export type AllowanceParams = FunctionArguments<typeof functions.allowance>
export type AllowanceReturn = FunctionReturn<typeof functions.allowance>

export type ApproveParams = FunctionArguments<typeof functions.approve>
export type ApproveReturn = FunctionReturn<typeof functions.approve>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BurnParams = FunctionArguments<typeof functions.burn>
export type BurnReturn = FunctionReturn<typeof functions.burn>

export type DecimalsParams = FunctionArguments<typeof functions.decimals>
export type DecimalsReturn = FunctionReturn<typeof functions.decimals>

export type FactoryParams = FunctionArguments<typeof functions.factory>
export type FactoryReturn = FunctionReturn<typeof functions.factory>

export type GetReservesParams = FunctionArguments<typeof functions.getReserves>
export type GetReservesReturn = FunctionReturn<typeof functions.getReserves>

export type InitializeParams = FunctionArguments<typeof functions.initialize>
export type InitializeReturn = FunctionReturn<typeof functions.initialize>

export type KLastParams = FunctionArguments<typeof functions.kLast>
export type KLastReturn = FunctionReturn<typeof functions.kLast>

export type MintParams = FunctionArguments<typeof functions.mint>
export type MintReturn = FunctionReturn<typeof functions.mint>

export type NameParams = FunctionArguments<typeof functions.name>
export type NameReturn = FunctionReturn<typeof functions.name>

export type NoncesParams = FunctionArguments<typeof functions.nonces>
export type NoncesReturn = FunctionReturn<typeof functions.nonces>

export type PermitParams = FunctionArguments<typeof functions.permit>
export type PermitReturn = FunctionReturn<typeof functions.permit>

export type Price0CumulativeLastParams = FunctionArguments<typeof functions.price0CumulativeLast>
export type Price0CumulativeLastReturn = FunctionReturn<typeof functions.price0CumulativeLast>

export type Price1CumulativeLastParams = FunctionArguments<typeof functions.price1CumulativeLast>
export type Price1CumulativeLastReturn = FunctionReturn<typeof functions.price1CumulativeLast>

export type SkimParams = FunctionArguments<typeof functions.skim>
export type SkimReturn = FunctionReturn<typeof functions.skim>

export type SwapParams = FunctionArguments<typeof functions.swap>
export type SwapReturn = FunctionReturn<typeof functions.swap>

export type SymbolParams = FunctionArguments<typeof functions.symbol>
export type SymbolReturn = FunctionReturn<typeof functions.symbol>

export type SyncParams = FunctionArguments<typeof functions.sync>
export type SyncReturn = FunctionReturn<typeof functions.sync>

export type Token0Params = FunctionArguments<typeof functions.token0>
export type Token0Return = FunctionReturn<typeof functions.token0>

export type Token1Params = FunctionArguments<typeof functions.token1>
export type Token1Return = FunctionReturn<typeof functions.token1>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type TransferFromParams = FunctionArguments<typeof functions.transferFrom>
export type TransferFromReturn = FunctionReturn<typeof functions.transferFrom>


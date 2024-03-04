import {LogEvent, Func, ContractBase} from './abi.support'


export type EventTypes = {
    Approval: { owner: string, spender: string, value: bigint },
    Transfer: { from: string, to: string, value: bigint },
}

export type FunctionTypes = {
    name: {args: {  }, return: string},
    approve: {args: { _spender: string, _value: bigint }, return: boolean},
    totalSupply: {args: {  }, return: bigint},
    transferFrom: {args: { _from: string, _to: string, _value: bigint }, return: boolean},
    decimals: {args: {  }, return: number},
    balanceOf: {args: { _owner: string }, return: bigint},
    symbol: {args: {  }, return: string},
    transfer: {args: { _to: string, _value: bigint }, return: boolean},
    allowance: {args: { _owner: string, _spender: string }, return: bigint},
}

export const events = {
    Approval: new LogEvent<EventTypes["Approval"]>(
        '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925', [{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}]
    ),
    Transfer: new LogEvent<EventTypes["Transfer"]>(
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', [{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}]
    ),
}

export const functions = {
    name: new Func<FunctionTypes["name"]["args"], FunctionTypes["name"]["return"]>(
        '0x06fdde03',
        [],
        [{"name":"","type":"string"}]
    ),
    approve: new Func<FunctionTypes["approve"]["args"], FunctionTypes["approve"]["return"]>(
        '0x095ea7b3',
        [{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],
        [{"name":"","type":"bool"}]
    ),
    totalSupply: new Func<FunctionTypes["totalSupply"]["args"], FunctionTypes["totalSupply"]["return"]>(
        '0x18160ddd',
        [],
        [{"name":"","type":"uint256"}]
    ),
    transferFrom: new Func<FunctionTypes["transferFrom"]["args"], FunctionTypes["transferFrom"]["return"]>(
        '0x23b872dd',
        [{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],
        [{"name":"","type":"bool"}]
    ),
    decimals: new Func<FunctionTypes["decimals"]["args"], FunctionTypes["decimals"]["return"]>(
        '0x313ce567',
        [],
        [{"name":"","type":"uint8"}]
    ),
    balanceOf: new Func<FunctionTypes["balanceOf"]["args"], FunctionTypes["balanceOf"]["return"]>(
        '0x70a08231',
        [{"name":"_owner","type":"address"}],
        [{"name":"balance","type":"uint256"}]
    ),
    symbol: new Func<FunctionTypes["symbol"]["args"], FunctionTypes["symbol"]["return"]>(
        '0x95d89b41',
        [],
        [{"name":"","type":"string"}]
    ),
    transfer: new Func<FunctionTypes["transfer"]["args"], FunctionTypes["transfer"]["return"]>(
        '0xa9059cbb',
        [{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],
        [{"name":"","type":"bool"}]
    ),
    allowance: new Func<FunctionTypes["allowance"]["args"], FunctionTypes["allowance"]["return"]>(
        '0xdd62ed3e',
        [{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],
        [{"name":"","type":"uint256"}]
    ),
}

export class Contract extends ContractBase {

    name(): Promise<string> {
        return this.eth_call(functions.name, [])
    }

    totalSupply(): Promise<bigint> {
        return this.eth_call(functions.totalSupply, [])
    }

    decimals(): Promise<number> {
        return this.eth_call(functions.decimals, [])
    }

    balanceOf(_owner: string): Promise<bigint> {
        return this.eth_call(functions.balanceOf, [_owner])
    }

    symbol(): Promise<string> {
        return this.eth_call(functions.symbol, [])
    }

    allowance(_owner: string, _spender: string): Promise<bigint> {
        return this.eth_call(functions.allowance, [_owner, _spender])
    }
}

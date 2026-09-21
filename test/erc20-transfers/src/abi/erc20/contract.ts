import { ContractBase } from '../abi.support.js'
import { allowance, balanceOf, decimals, name, symbol, totalSupply } from './functions.js'
import type { AllowanceParams, BalanceOfParams } from './functions.js'

export class Contract extends ContractBase {
    name() {
        return this.eth_call(name, {})
    }

    totalSupply() {
        return this.eth_call(totalSupply, {})
    }

    decimals() {
        return this.eth_call(decimals, {})
    }

    balanceOf(_owner: BalanceOfParams["_owner"]) {
        return this.eth_call(balanceOf, {_owner})
    }

    symbol() {
        return this.eth_call(symbol, {})
    }

    allowance(_owner: AllowanceParams["_owner"], _spender: AllowanceParams["_spender"]) {
        return this.eth_call(allowance, {_owner, _spender})
    }
}

import { ContractBase } from '../abi.support.js'
import { MAX_UINT, _totalSupply, allowance, balanceOf, basisPointsRate, calcFee, decimals, deprecated, getBlackListStatus, isBlackListed, maximumFee, name, oldBalanceOf, owner, paused, symbol, totalSupply, upgradedAddress } from './functions.js'
import type { AllowanceParams, BalanceOfParams, CalcFeeParams, GetBlackListStatusParams, IsBlackListedParams, OldBalanceOfParams } from './functions.js'

export class Contract extends ContractBase {
    name() {
        return this.eth_call(name, {})
    }

    deprecated() {
        return this.eth_call(deprecated, {})
    }

    totalSupply() {
        return this.eth_call(totalSupply, {})
    }

    upgradedAddress() {
        return this.eth_call(upgradedAddress, {})
    }

    decimals() {
        return this.eth_call(decimals, {})
    }

    maximumFee() {
        return this.eth_call(maximumFee, {})
    }

    _totalSupply() {
        return this.eth_call(_totalSupply, {})
    }

    getBlackListStatus(_maker: GetBlackListStatusParams["_maker"]) {
        return this.eth_call(getBlackListStatus, {_maker})
    }

    paused() {
        return this.eth_call(paused, {})
    }

    balanceOf(who: BalanceOfParams["who"]) {
        return this.eth_call(balanceOf, {who})
    }

    calcFee(_value: CalcFeeParams["_value"]) {
        return this.eth_call(calcFee, {_value})
    }

    owner() {
        return this.eth_call(owner, {})
    }

    symbol() {
        return this.eth_call(symbol, {})
    }

    oldBalanceOf(who: OldBalanceOfParams["who"]) {
        return this.eth_call(oldBalanceOf, {who})
    }

    allowance(_owner: AllowanceParams["_owner"], _spender: AllowanceParams["_spender"]) {
        return this.eth_call(allowance, {_owner, _spender})
    }

    basisPointsRate() {
        return this.eth_call(basisPointsRate, {})
    }

    isBlackListed(_0: IsBlackListedParams["_0"]) {
        return this.eth_call(isBlackListed, {_0})
    }

    MAX_UINT() {
        return this.eth_call(MAX_UINT, {})
    }
}

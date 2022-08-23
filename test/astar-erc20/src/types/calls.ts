import assert from 'assert'
import {Chain, ChainContext, CallContext, Call, Result} from './support'
import * as v1 from './v1'
import * as v9 from './v9'

export class EthereumTransactCall {
  private readonly _chain: Chain
  private readonly call: Call

  constructor(ctx: CallContext)
  constructor(ctx: ChainContext, call: Call)
  constructor(ctx: CallContext, call?: Call) {
    call = call || ctx.call
    assert(call.name === 'Ethereum.transact')
    this._chain = ctx._chain
    this.call = call
  }

  /**
   * Transact an Ethereum transaction.
   */
  get isV1(): boolean {
    return this._chain.getCallHash('Ethereum.transact') === '27ed559a6856e5085900eccf20290c958992ff554f041fdc4516e405fc8ddb97'
  }

  /**
   * Transact an Ethereum transaction.
   */
  get asV1(): {transaction: v1.LegacyTransaction} {
    assert(this.isV1)
    return this._chain.decodeCall(this.call)
  }

  /**
   * Transact an Ethereum transaction.
   */
  get isV9(): boolean {
    return this._chain.getCallHash('Ethereum.transact') === '141b9fbf21429ca5123d8cd59859311499b6d8eb06fdd0a71b9b4b097e14a234'
  }

  /**
   * Transact an Ethereum transaction.
   */
  get asV9(): {transaction: v9.TransactionV2} {
    assert(this.isV9)
    return this._chain.decodeCall(this.call)
  }
}

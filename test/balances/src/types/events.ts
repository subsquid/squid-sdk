import assert from 'assert'
import {decodeEvent, EventContext, getEventHash, Result} from './support'
import * as v9130 from './v9130'

export class BalancesTransferEvent {
  constructor(private ctx: EventContext) {
    assert(this.ctx.event.name === 'balances.Transfer')
  }

  /**
   *  Transfer succeeded (from, to, value, fees).
   */
  get isV1020(): boolean {
    let h = this.ctx.block.height
    return h <= 1375086
  }

  /**
   *  Transfer succeeded (from, to, value, fees).
   */
  get asV1020(): [Uint8Array, Uint8Array, bigint, bigint] {
    assert(this.isV1020)
    return decodeEvent(this.ctx)
  }

  /**
   *  Transfer succeeded (from, to, value).
   */
  get isV1050(): boolean {
    let h = this.ctx.block.height
    return 1375086 < h && h <= 10403784
  }

  /**
   *  Transfer succeeded (from, to, value).
   */
  get asV1050(): [Uint8Array, Uint8Array, bigint] {
    assert(this.isV1050)
    return decodeEvent(this.ctx)
  }

  /**
   * Transfer succeeded.
   */
  get isLatest(): boolean {
    return this.ctx.block.height > 10403784 && getEventHash(this.ctx.chainDescription, 'balances.Transfer') === '68dcb27fbf3d9279c1115ef6dd9d30a3852b23d8e91c1881acd12563a212512d'
  }

  /**
   * Transfer succeeded.
   */
  get asLatest(): {from: v9130.AccountId32, to: v9130.AccountId32, amount: bigint} {
    assert(this.isLatest)
    return decodeEvent(this.ctx)
  }
}

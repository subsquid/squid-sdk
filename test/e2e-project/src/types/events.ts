import assert from 'assert'
import {EventContext, Result} from './support'

export class BalancesTransferEvent {
  constructor(private ctx: EventContext) {
    assert(this.ctx.event.name === 'balances.Transfer')
  }

  /**
   *  Transfer succeeded. \[from, to, value\]
   */
  get isLatest(): boolean {
    return this.ctx._chain.getEventHash('balances.Transfer') === '2082574713e816229f596f97b58d3debbdea4b002607df469a619e037cc11120'
  }

  /**
   *  Transfer succeeded. \[from, to, value\]
   */
  get asLatest(): [Uint8Array, Uint8Array, bigint] {
    assert(this.isLatest)
    return this.ctx._chain.decodeEvent(this.ctx.event)
  }
}

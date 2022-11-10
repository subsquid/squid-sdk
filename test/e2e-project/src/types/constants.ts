import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result, Option} from './support'

export class SystemMaximumBlockLengthConstant {
  private readonly _chain: Chain

  constructor(ctx: ChainContext) {
    this._chain = ctx._chain
  }

  /**
   *  The maximum length of a block (in bytes).
   */
  get isV1() {
    return this._chain.getConstantTypeHash('System', 'MaximumBlockLength') === 'b76f37d33f64f2d9b3234e29034ab4a73ee9da01a61ab139c27f8c841971e469'
  }

  /**
   *  The maximum length of a block (in bytes).
   */
  get asV1(): number {
    assert(this.isV1)
    return this._chain.getConstant('System', 'MaximumBlockLength')
  }

  /**
   * Checks whether the constant is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getConstantTypeHash('System', 'MaximumBlockLength') != null
  }
}

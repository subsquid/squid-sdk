import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result} from './support'

export class SystemSS58PrefixConstant {
  private readonly _chain: Chain

  constructor(ctx: ChainContext) {
    this._chain = ctx._chain
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get isV2028() {
    return this._chain.getConstantTypeHash('System', 'SS58Prefix') === 'afecacff3b029831d50a478055aa405254e6579585f9617d2a2f34743b4aff83'
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get asV2028(): number {
    assert(this.isV2028)
    return this._chain.getConstant('System', 'SS58Prefix')
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get isV9050() {
    return this._chain.getConstantTypeHash('System', 'SS58Prefix') === '32def12560ecd411fe2fc796552e97d0d5ee0ea10e059b3d8918c9e94dfdb334'
  }

  /**
   *  The designated SS85 prefix of this chain.
   * 
   *  This replaces the "ss58Format" property declared in the chain spec. Reason is
   *  that the runtime should know about the prefix in order to make use of it as
   *  an identifier of the chain.
   */
  get asV9050(): number {
    assert(this.isV9050)
    return this._chain.getConstant('System', 'SS58Prefix')
  }

  /**
   * Checks whether the constant is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getConstantTypeHash('System', 'SS58Prefix') != null
  }
}

import * as base from '@subsquid/solana-stream'
import {setUpRelations} from './relations'
import * as types from './types'
import {Block} from './items'


export function augmentBlock<F extends base.FieldSelection>(src: base.Block<F>): types.Block<F> {
    let block = Block.fromPartial(src)
    setUpRelations(block)
    return block as unknown as types.Block<F>
}

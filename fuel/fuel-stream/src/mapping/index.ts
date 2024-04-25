import {addErrorContext} from '@subsquid/util-internal'
import {PartialBlock} from '../interfaces/data-partial'
import {Block} from './items'
import {setUpRelations} from './relations'


export * from './items'


export function mapBlock(src: PartialBlock): Block {
    try {
        let block = Block.fromPartial(src)
        setUpRelations(block)
        return block
    } catch(err: any) {
        throw addErrorContext(err, {
            blockHeight: src.header.height,
            blockHash: src.header.hash,
        })
    }
}

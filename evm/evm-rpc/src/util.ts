import {BlockRef} from '@subsquid/util-internal-data-source'
import {Block} from './types'


export function getBlockRef(block: Block): BlockRef {
    return {
        number: block.number,
        hash: block.block.hash
    }
}

import {Block} from '../interfaces/data'
import {RawBlock} from '../interfaces/data-raw'
import {Runtime} from '../runtime'
import {BlockParser, ParsingOptions} from './block'


export function parseRawBlock(runtime:  Runtime, rawBlock: RawBlock, options?: ParsingOptions): Block {
    let parser = new BlockParser(runtime, rawBlock, options)
    let block: Block = {
        header: parser.header()
    }
    if (parser.extrinsics()) {
        block.extrinsics = parser.extrinsics()!.map(item => item.extrinsic)
        block.calls = parser.calls()
    }
    if (parser.events()) {
        block.events = parser.events()
    }
    return block
}

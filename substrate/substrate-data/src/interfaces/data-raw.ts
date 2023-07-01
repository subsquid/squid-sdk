import type {BlockData, Bytes} from '@subsquid/substrate-raw-data'


export interface RawBlock extends BlockData {
    validators?: Bytes
}

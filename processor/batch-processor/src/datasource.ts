import type {Range, FiniteRange} from '@subsquid/util-internal-range'
import {HashAndHeight} from './database'


export interface DataSource<B> {
    getHeight(): Promise<number>
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<string | undefined>
    getBlockStream(opts: {range?: Range, supportHotBlocks?: boolean}): AsyncIterable<{finalizedHead: HashAndHeight, blocks: B[]}>
    getBlocksCountInRange?(range: FiniteRange): number
}

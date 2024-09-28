import type {Range, FiniteRange} from '@subsquid/util-internal-range'
import {HashAndHeight} from './database'

export interface BlocksData<B> {
    finalizedHead: HashAndHeight
    /**
     * always reversed
     */
    rollbacks: HashAndHeight[]
    
    blocks: B[]
}

export interface DataSource<B> {
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<string | undefined>
    getBlockStream(opts: {range?: Range, supportHotBlocks?: boolean}): AsyncIterable<BlocksData<B>>
    getBlocksCountInRange?(range: FiniteRange): number
}

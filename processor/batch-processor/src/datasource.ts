import type {FiniteRange} from '@subsquid/util-internal-range'


export interface DataSource<B> {
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<string | undefined>
    getBlockStream(fromBlock?: number): AsyncIterable<B[]>
    getBlocksCountInRange?(range: FiniteRange): number
}

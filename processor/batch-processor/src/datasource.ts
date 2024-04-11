
export interface DataSource<B> {
    getFinalizedHeight(): Promise<number>
    getBlockHash(height: number): Promise<string | undefined>
    getBlockStream(fromBlock?: number): AsyncIterable<B[]>
    getBlocksLeft?(fromBlock: number): number
}

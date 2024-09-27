import * as tools from '@subsquid/util-internal-processor-tools'


export function formatId(block: tools.HashAndHeight, ...address: number[]): string {
    // skip first 8 bytes containing block number
    let hash = block.hash.slice(16)
    let height = block.height
    return tools.formatId({height, hash}, ...address)
}

import {run, withContext} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/evm-objects'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import {provideStore, provideTemplates} from './hooks'
import {dataSource, type Block, type Log} from './source'
import {handleSushi} from './sushi'
import {handleUni} from './uniswap'

export type LogHandler = (log: Log, blockNumber: number) => Promise<void>

const handlers: LogHandler[] = [handleSushi, handleUni]

async function processBlocks(blocks: Block[]): Promise<void> {
    for (const block of blocks) {
        const augmented = augmentBlock(block)
        const {number: blockNumber} = block.header

        for (const log of augmented.logs) {
            for (const handler of handlers) {
                await handler(log, blockNumber)
            }
        }
    }
}

run(dataSource, new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    await withContext([provideStore(ctx.store), provideTemplates(ctx.templates)], async () => {
        await processBlocks(ctx.blocks)
    })
})

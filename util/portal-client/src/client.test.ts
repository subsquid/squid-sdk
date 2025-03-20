import {PortalClient} from './client'
import {HttpClient} from '@subsquid/http-client'

async function main() {
    let portal = new PortalClient({
        url: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
        http: new HttpClient({
            retryAttempts: Infinity,
        }),
        minBytes: 50 * 1024 * 1024,
    })

    let from = await portal.getHead().then((h) => (h?.number ?? 0) - 1_000_000)

    let query = {
        type: 'evm',
        fromBlock: from,
        fields: {
            block: {
                number: true,
                hash: true,
            },
            transaction: {
                from: true,
                to: true,
                hash: true,
            },
            log: {
                address: true,
                topics: true,
                data: true,
                transactionHash: true,
                logIndex: true,
                transactionIndex: true,
            },
            stateDiff: {
                kind: true,
                next: true,
                prev: true,
            },
        },
        logs: [
            {
                address: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
                topic0: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
            },
        ],
    }

    for await (let {blocks, finalizedHead} of portal.getFinalizedStream(query, {stopOnHead: true})) {
        console.log(
            `[${new Date().toISOString()}] progress: ${blocks[blocks.length - 1].header.number} / ${
                finalizedHead?.number ?? -1
            }` + `, blocks: ${blocks.length}`
        )
    }
    console.log(`end`)
}

main()

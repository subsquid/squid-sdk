import {BlockRef, isForkException, PortalClient} from './client'

const baseQuery = {
    type: 'evm',
    fromBlock: 23_000_000,
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

async function main() {
    let portal = new PortalClient({
        url: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
        http: {
            retryAttempts: Infinity,
        },
        minBytes: 50 * 1024 * 1024,
    })

    let chain: BlockRef[] = []
    while (true) {
        try {
            const head = chain[chain.length - 1]
            const override = head ? {fromBlock: head.number + 1, parentBlockHash: head.hash} : undefined
            const query = {...baseQuery, ...override}
            for await (let {blocks, finalizedHead} of portal.getStream(query)) {
                if (finalizedHead != null) {
                    for (let head of chain) {
                        if (head.number > finalizedHead.number) break
                        chain.shift()
                    }
                }

                if (blocks.length == 0) continue
                for (let block of blocks) {
                    if (finalizedHead != null && block.header.number <= finalizedHead.number) break
                    chain.push({
                        number: block.header.number,
                        hash: block.header.hash!,
                    })
                }

                let lastBlock = blocks[blocks.length - 1]
                let head = Math.max(lastBlock.header.number, finalizedHead?.number ?? -1)

                console.log(`progress: ${lastBlock.header.number} / ${head}` + `, blocks: ${blocks.length}`)
            }
        } catch (e) {
            if (!isForkException(e)) throw e

            let forkIndex = findFork(chain, e.lastBlocks)
            if (forkIndex === -1) throw new Error('Unable to process fork')

            chain = chain.slice(0, forkIndex + 1)

            const forkBlock = chain[chain.length - 1]
            console.log(`detected fork at block ${forkBlock.number} (${e.head.number - forkBlock.number} depth)`)
        }
    }
}

function findFork(chainA: BlockRef[], chainB: BlockRef[]) {
    let forkPoint = -1
    for (let i = 0; i < chainA.length; i++) {
        const blockA = chainA[i]
        for (let j = 0; j < chainB.length; j++) {
            let blockB = chainB[j]
            if (blockB.number > blockA.number) break
            if (blockB.number < blockA.number) continue
            if (blockB.number === blockA.number && blockB.hash !== blockA.hash) {
                return forkPoint
            }
        }
        forkPoint = i
    }
    return forkPoint
}

main()

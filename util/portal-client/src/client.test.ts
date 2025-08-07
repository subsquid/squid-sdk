import {BlockRef, isForkException, PortalClient, PortalQuery} from './client'

const baseQuery: PortalQuery = {
    type: 'evm',
    fromBlock: 23_000_000,
    fields: {
        block: {
            number: true,
            hash: true,
            timestamp: true,
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

const solanaQuery: PortalQuery = {
    type: 'solana',
    fromBlock: 358_000_000,
    fields: {
        block: {number: true, timestamp: true, hash: true, parentHash: true},
        transaction: {signatures: true, err: true, transactionIndex: true},
        instruction: {
            programId: true,
            accounts: true,
            data: true,
            isCommitted: true,
            transactionIndex: true,
            instructionAddress: true,
        },
    },
    instructions: [
        {
            programId: ['whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'],
            d8: ['0xf8c69e91e17587c8'],
            isCommitted: true,
            innerInstructions: true,
        },
    ],
}

async function main() {
    let portal = new PortalClient({
        url: 'https://portal.sqd.dev/datasets/solana-mainnet',
        http: {
            retryAttempts: Infinity,
        },
        minBytes: 50 * 1024 * 1024,
    })

    let coldHead: BlockRef | undefined = undefined
    let hotHeads: BlockRef[] = []
    while (true) {
        const query = {...solanaQuery}

        const head = hotHeads[hotHeads.length - 1] ?? coldHead
        if (head != null) {
            query.fromBlock = head.number + 1
            query.parentBlockHash = head.hash
        }

        try {
            for await (let {blocks, finalizedHead} of portal.getStream(query)) {
                if (finalizedHead != null) {
                    const unfinalizedIndex = hotHeads.findIndex((head) => head.number > finalizedHead.number)
                    if (unfinalizedIndex < 0) {
                        coldHead = hotHeads[hotHeads.length - 1]
                        hotHeads = []
                    } else if (unfinalizedIndex > 0) {
                        coldHead = hotHeads[unfinalizedIndex - 1]
                        hotHeads = hotHeads.slice(unfinalizedIndex)
                    }
                }
                if (blocks.length == 0) continue

                for (let block of blocks) {
                    const blockRef = {
                        number: block.header.number,
                        hash: block.header.hash!,
                    }

                    if (finalizedHead != null && block.header.number <= finalizedHead.number) {
                        coldHead = blockRef
                    } else {
                        hotHeads.push(blockRef)
                    }
                }

                let head = hotHeads[hotHeads.length - 1] ?? coldHead
                let portalHead = Math.max(head.number, finalizedHead?.number ?? -1)
                console.log(`progress: ${head.number} / ${portalHead}` + `, blocks: ${blocks.length}`)
                console.log(`  \u001b[2mcold head: ${coldHead ? formatRef(coldHead) : 'N/A'}\u001b[0m`)
                console.log(`  \u001b[2mhot heads: ${hotHeads.map((h) => formatRef(h)).join(', ') || 'N/A'}\u001b[0m`)
            }
        } catch (e) {
            if (!isForkException(e)) throw e

            let chain = coldHead ? [coldHead, ...hotHeads] : hotHeads
            let forkIndex = findFork(chain, e.lastBlocks)
            if (forkIndex === -1) throw new Error('Unable to process fork')

            const forkBlock = chain[forkIndex]
            console.log(`detected fork at block ${forkBlock.number} (${e.head.number - forkBlock.number} depth)`)

            hotHeads = chain.slice(forkIndex + 1)
        }
    }
}

function formatRef(ref: BlockRef) {
    return `${ref.number}#${ref.hash.slice(2, 8)}`
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

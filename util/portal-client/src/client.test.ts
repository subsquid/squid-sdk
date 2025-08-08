import {BlockRef, createQuery, isForkException, PortalClient} from './client'

const portalUrls = {
    evm: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
    solana: 'https://portal.sqd.dev/datasets/solana-mainnet',
}

const queries = {
    evm: createQuery({
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
    }),
    solana: createQuery({
        type: 'solana',
        fromBlock: 358_600_000,
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
    }),
}

async function main() {
    const queryType = 'solana'
    const query = queries[queryType]

    let portal = new PortalClient({
        url: portalUrls[queryType],
        http: {
            retryAttempts: Infinity,
        },
        minBytes: 50 * 1024 * 1024,
    })

    let coldHead: BlockRef | undefined = undefined
    let hotHeads: BlockRef[] = []
    while (true) {
        const currentQuery = {...query}

        const head = hotHeads[hotHeads.length - 1] ?? coldHead
        if (head != null && head.number > currentQuery.fromBlock) {
            currentQuery.fromBlock = head.number + 1
            currentQuery.parentBlockHash = head.hash
        }

        try {
            for await (let {blocks, finalizedHead} of portal.getStream(currentQuery)) {
                let unfinalizedIndex = 0
                if (finalizedHead) {
                    unfinalizedIndex = blocks.findIndex((b) => b.header.number > finalizedHead?.number)
                }

                // all new blocks are finalized
                if (unfinalizedIndex < 0) {
                    const finalizedRef = blocks[blocks.length - 1].header
                    coldHead = {number: finalizedRef.number, hash: finalizedRef.hash}
                    // finalize all hot heads
                    hotHeads = []
                } else {
                    const finalizedRef = finalizedHead ?? blocks[unfinalizedIndex - 1]?.header
                    coldHead = finalizedRef ?? coldHead

                    // finalize all hot heads that are older than the cold head
                    if (coldHead) {
                        let finalizeIndex = hotHeads.findIndex((h) => h.number > coldHead!.number)
                        hotHeads = finalizeIndex < 0 ? [] : hotHeads.slice(finalizeIndex)
                    }

                    // process unfinalized blocks
                    for (let i = unfinalizedIndex; i < blocks.length; i++) {
                        hotHeads.push({number: blocks[i].header.number, hash: blocks[i].header.hash})
                    }
                }

                let head = hotHeads[hotHeads.length - 1] ?? coldHead
                let portalHead = Math.max(head.number, finalizedHead?.number ?? -1)
                console.log(`progress: ${head.number} / ${portalHead}` + `, blocks: ${blocks.length}`)
                console.log(`  \u001b[2mcold head: ${coldHead ? formatRef(coldHead) : 'N/A'}\u001b[0m`)
                console.log(`  \u001b[2mhot heads: ${hotHeads.map((h) => formatRef(h)).join(', ') || 'N/A'}\u001b[0m`)
            }
            break
        } catch (e) {
            if (!isForkException(e)) throw e

            let chain = coldHead ? [coldHead, ...hotHeads] : hotHeads
            let rollbackIndex = findRollbackIndex(chain, e.lastBlocks)
            if (rollbackIndex === -1) throw new Error('Unable to process fork')

            const rollbackHead = chain[rollbackIndex]
            console.log(`detected fork at block ${rollbackHead.number} (${e.head.number - rollbackHead.number} depth)`)

            hotHeads = chain.slice(1, rollbackIndex + 1)
        }
    }
}

function findRollbackIndex(chainA: BlockRef[], chainB: BlockRef[]) {
    let i = 0
    let j = 0
    for (; i < chainA.length; i++) {
        const blockA = chainA[i]
        for (; j < chainB.length; j++) {
            let blockB = chainB[j]
            if (blockB.number > blockA.number) break
            if (blockB.number === blockA.number && blockB.hash !== blockA.hash) return i - 1
        }
    }
    return i - 1
}

function formatRef(ref: BlockRef) {
    return `${ref.number}#${ref.hash.slice(2, 8)}`
}

main()

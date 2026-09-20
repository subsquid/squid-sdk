import {describe, expect, it} from 'vitest'
import {getComponentsRule} from './components'
import type {RawBlock} from '@subsquid/evm-normalization'
import {
    FakeStream,
    linkOf,
    loadMainnetBlock,
    makeBlock,
    makeChain,
    makeChildBlock,
    makeHash,
    makeMessage,
    testChainUtils,
    TimeoutError,
    verifyTestLine,
    withRealHash,
} from './test-util'
import {createLineVerifier} from './verify'
import {walk, type WalkRequest} from './walk'
import {ChainUtils} from '@subsquid/evm-rpc'

const rule = getComponentsRule({})

function request(stream: FakeStream, from: number, top: ReturnType<typeof linkOf>): WalkRequest {
    return {
        get: stream.get,
        rule,
        verify: verifyTestLine,
        top,
        from,
        parsedBudget: 1_000_000,
        payloadBudget: 1_000_000,
    }
}

describe('walk', () => {
    it('takes the whole range in ascending order', async () => {
        let chain = makeChain(10, 20)
        let stream = new FakeStream().putChain(chain)

        let res = await walk(request(stream, 12, linkOf(chain[10])))

        expect(res.miss).toBeUndefined()
        expect(res.blocks.map((b) => b.getBlock())).toEqual(chain.slice(2))
        expect(stream.requests.map((r) => r.number)).toEqual([20, 19, 18, 17, 16, 15, 14, 13, 12])
    })

    it('takes only the linked block out of two at one height', async () => {
        let chain = makeChain(10, 15)
        let orphan = makeBlock(13, 'fork', 'main')
        let stream = new FakeStream().putChain(chain).put(orphan)

        let res = await walk(request(stream, 10, linkOf(chain[5])))

        expect(res.miss).toBeUndefined()
        expect(res.blocks.map((b) => b.hash)).toEqual(chain.map((b) => b.hash))
        expect(stream.requests).not.toContainEqual(linkOf(orphan))
    })

    it('follows a fork when the top is on it', async () => {
        let main = makeChain(10, 12)
        let forkStart = makeBlock(13, 'fork', 'main')
        let fork = [forkStart, makeChildBlock(forkStart, 'fork')]
        let stream = new FakeStream().putChain(main).putChain(makeChain(13, 14)).putChain(fork)

        let res = await walk(request(stream, 10, linkOf(fork[1])))

        expect(res.blocks.map((b) => b.hash)).toEqual([...main, ...fork].map((b) => b.hash))
    })

    it('stops at a gap and keeps what is above it', async () => {
        let chain = makeChain(10, 20)
        let stream = new FakeStream().putChain(chain).remove(chain[5])

        let res = await walk(request(stream, 10, linkOf(chain[10])))

        expect(res.miss).toMatchObject({number: 15, reason: 'not_found'})
        expect(res.blocks.map((b) => b.number)).toEqual([16, 17, 18, 19, 20])
        expect(stream.requests.map((r) => r.number)).toEqual([20, 19, 18, 17, 16, 15])
    })

    it('takes nothing when the top is absent', async () => {
        let chain = makeChain(10, 20)
        let stream = new FakeStream().putChain(chain.slice(0, 10))

        let res = await walk(request(stream, 10, linkOf(chain[10])))

        expect(res.miss).toMatchObject({number: 20, reason: 'not_found'})
        expect(res.blocks).toEqual([])
        expect(stream.requests).toHaveLength(1)
    })

    it('stops at a payload with a bad checksum', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain).put(chain[2], {payload_crc32: 'deadbeef'})

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toEqual({number: 12, reason: 'crc'})
        expect(res.blocks.map((b) => b.number)).toEqual([13, 14])
    })

    it('stops at an unknown schema', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain).put(chain[3], {schema: 'evm-raw-line-zstd/2'})

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toEqual({number: 13, reason: 'schema'})
        expect(res.blocks.map((b) => b.number)).toEqual([14])
    })

    it('stops at components the dumper can not take', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain).put(chain[3], {components: 'receipts,traces'})

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toEqual({number: 13, reason: 'components'})
    })

    it('does not trust a parent link the line does not confirm', async () => {
        let chain = makeChain(10, 14)
        let foreign = makeBlock(12, 'foreign')

        // headers of 13 point to a foreign parent, the line still names the real one
        let stream = new FakeStream()
            .putChain(chain)
            .put(foreign)
            .putMessage(chain[3], makeMessage(chain[3], {parent_hash: foreign.hash}))

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toEqual({number: 13, reason: 'link'})
        expect(res.blocks.map((b) => b.number)).toEqual([14])
    })

    it('stops at a timeout', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain).fail(chain[1], new TimeoutError('timeout'))

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toMatchObject({number: 11, reason: 'timeout'})
        expect(res.blocks.map((b) => b.number)).toEqual([12, 13, 14])
    })

    it('stops at a transport error', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain).fail(chain[4], new Error('connection closed'))

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        let failure = new Error('connection closed')
        expect(res.miss).toEqual({number: 14, reason: 'error', error: failure})
        expect(res.blocks).toEqual([])
    })

    it('asks for the parent before the line of the child is parsed', async () => {
        let chain = makeChain(10, 12)
        let stream = new FakeStream().putChain(chain).put(chain[2], {payload_crc32: 'deadbeef'})

        let res = await walk(request(stream, 10, linkOf(chain[2])))

        expect(res.miss).toEqual({number: 12, reason: 'crc'})
        expect(stream.requests.map((r) => r.number)).toEqual([12, 11])
    })

    it('gives the same blocks when the parsed lines do not fit the budget', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain)

        let res = await walk({
            ...request(stream, 10, linkOf(chain[4])),
            parsedBudget: 0,
        })

        expect(res.blocks.map((b) => b.getBlock())).toEqual(chain)
    })

    it('stops above its bottom when the payloads fill the budget', async () => {
        let chain = makeChain(10, 14)
        let stream = new FakeStream().putChain(chain)

        let twoBlocks = makeMessage(chain[4]).data.length + makeMessage(chain[3]).data.length
        let res = await walk({
            ...request(stream, 10, linkOf(chain[4])),
            payloadBudget: twoBlocks,
        })

        // a stop on the budget is not a miss, the caller is free to take the rest from elsewhere
        expect(res.miss).toBeUndefined()
        expect(res.blocks.map((b) => b.number)).toEqual([13, 14])
        expect(res.bytes).toBeLessThanOrEqual(twoBlocks)
    })

    it('reports the payload bytes it holds', async () => {
        let chain = makeChain(10, 12)
        let stream = new FakeStream().putChain(chain)

        let res = await walk(request(stream, 10, linkOf(chain[2])))

        expect(res.bytes).toBe(chain.reduce((sum, block) => sum + makeMessage(block).data.length, 0))
    })

    it('ends at genesis without asking for its parent', async () => {
        let chain = makeChain(0, 2)
        let stream = new FakeStream().putChain(chain)

        let res = await walk(request(stream, 0, linkOf(chain[2])))

        expect(res.miss).toBeUndefined()
        expect(res.blocks.map((b) => b.number)).toEqual([0, 1, 2])
        expect(stream.requests.map((r) => r.number)).toEqual([2, 1, 0])
    })
})

/**
 * What anybody able to publish to the stream can do: the hash strings are real, the content is not
 */
function forge(block: RawBlock, changes: object): RawBlock {
    return {...block, ...changes} as RawBlock
}

describe('walk over forged blocks', () => {
    it('misses on a body with junk under the real hash', async () => {
        let chain = makeChain(10, 14)

        let forged = forge(chain[2], {
            stateRoot: makeHash('junk state'),
            transactions: [{hash: makeHash('junk tx')}],
        })

        let stream = new FakeStream().putChain(chain).put(forged)
        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toMatchObject({number: 12, reason: 'hash'})
        expect(res.blocks.map((b) => b.number)).toEqual([13, 14])
    })

    it('misses on a header that can not be hashed', async () => {
        let chain = makeChain(10, 12)
        let stream = new FakeStream().putChain(chain).put(forge(chain[1], {stateRoot: 'junk'}))

        let res = await walk(request(stream, 10, linkOf(chain[2])))

        expect(res.miss).toMatchObject({number: 11, reason: 'hash'})
    })

    it('takes nothing below a tampered parent hash', async () => {
        let chain = makeChain(10, 14)

        // a valid chain of somebody's own making, attached under a real block
        let foreign = makeChain(10, 11, 'foreign')
        let foreignTop = makeChildBlock(foreign[1], 'foreign')
        let tampered = forge(chain[3], {parentHash: foreignTop.hash})

        let stream = new FakeStream()
            .putChain([...foreign, foreignTop])
            .putChain(chain)
            .put(tampered)

        let res = await walk(request(stream, 10, linkOf(chain[4])))

        expect(res.miss).toMatchObject({number: 13, reason: 'hash'})
        expect(res.blocks.map((b) => b.hash)).toEqual([chain[4].hash])
    })

    it('misses on a number that is not the one of the header', async () => {
        let chain = makeChain(10, 12)

        // published at the height of 11 under the hash of 11, while the header is the one of 12
        let forged = forge(chain[2], {number: chain[1].number, hash: chain[1].hash, parentHash: chain[1].parentHash})

        let stream = new FakeStream().putChain(chain).put(forged)
        let res = await walk(request(stream, 10, linkOf(chain[2])))

        expect(res.miss).toMatchObject({number: 11, reason: 'hash'})
    })

    it('misses on transactions and logs of another block', async () => {
        let block = loadMainnetBlock()
        let foreignHash = makeHash('another block')

        let cases: RawBlock[] = [
            forge(block, {transactions: block.transactions.map((tx) => ({...tx, blockHash: foreignHash}))}),
            forge(block, {transactions: block.transactions.map((tx) => ({...tx, blockNumber: '0x1'}))}),
            forge(block, {transactions: [...block.transactions].reverse()}),
            forge(block, {
                transactions: block.transactions.map((tx) => ({
                    ...tx,
                    receipt_: {...tx.receipt_, blockHash: foreignHash},
                })),
            }),
            forge(block, {
                transactions: block.transactions.map((tx, i, all) => ({
                    ...tx,
                    receipt_: all[(i + 1) % all.length].receipt_,
                })),
            }),
            forge(block, {
                transactions: block.transactions.map((tx) => ({
                    ...tx,
                    receipt_: {
                        ...tx.receipt_,
                        logs: tx.receipt_!.logs.map((log) => ({...log, blockHash: foreignHash})),
                    },
                })),
            }),
        ]

        let withReceipts = getComponentsRule({withReceipts: true})
        let verify = createLineVerifier(testChainUtils, {withReceipts: true})

        for (let forged of cases) {
            let stream = new FakeStream().put(forged, {components: 'receipts'})
            let res = await walk({
                ...request(stream, Number(block.number), linkOf(block)),
                rule: withReceipts,
                verify,
            })

            expect(res.miss).toMatchObject({reason: 'verify'})
            expect(res.blocks).toEqual([])
        }
    })

    it('misses on logs of another block', async () => {
        let block = makeBlock(10)
        let receipt = loadMainnetBlock().transactions[0].receipt_!
        let stream = new FakeStream().put(forge(block, {logs_: receipt.logs}))

        let res = await walk(request(stream, 10, linkOf(block)))

        expect(res.miss).toMatchObject({number: 10, reason: 'verify'})
    })

    it('misses on a block that holds not what the dumper fetches', async () => {
        let block = loadMainnetBlock()

        // the tag says `logs`, the line comes with receipts and without logs
        let stream = new FakeStream().put(block)
        let res = await walk(request(stream, Number(block.number), linkOf(block)))

        expect(res.miss).toMatchObject({reason: 'verify', details: 'logs are missing'})
    })
})

describe('walk with the verifications of the dumper', () => {
    let options = {
        withReceipts: true,
        verifyBlockHash: true,
        verifyTxRoot: true,
        verifyTxSender: true,
        verifyReceiptsRoot: true,
        verifyWithdrawalsRoot: true,
        verifyLogsBloom: true,
    }

    let tag = 'receipts,v-block-hash,v-tx-sender,v-tx-root,v-receipts-root,v-withdrawals-root,v-logs-bloom'

    function verifiedRequest(stream: FakeStream, block: RawBlock, verifyOptions: object = options): WalkRequest {
        return {
            ...request(stream, Number(block.number), linkOf(block)),
            rule: getComponentsRule(options),
            verify: createLineVerifier(testChainUtils, verifyOptions),
        }
    }

    it('takes a real block', async () => {
        let block = loadMainnetBlock()
        let stream = new FakeStream().put(block, {components: tag})

        let res = await walk(verifiedRequest(stream, block))

        expect(res.miss).toBeUndefined()
        expect(res.blocks.map((b) => b.getBlock())).toEqual([block])
    })

    it('misses on forged receipts', async () => {
        let block = loadMainnetBlock()

        let transactions = block.transactions.map((tx) => ({...tx}))
        transactions[7].receipt_ = {
            ...transactions[7].receipt_!,
            status: transactions[7].receipt_!.status == '0x1' ? '0x0' : '0x1',
        }

        let stream = new FakeStream().put(forge(block, {transactions}), {components: tag})
        let res = await walk(verifiedRequest(stream, block))

        expect(res.miss).toMatchObject({reason: 'verify', details: 'failed to verify receipts root'})
        expect(res.blocks).toEqual([])
    })

    it('takes the same forged receipts when the dumper does not verify them', async () => {
        let block = loadMainnetBlock()

        let transactions = block.transactions.map((tx) => ({...tx}))
        transactions[7].receipt_ = {
            ...transactions[7].receipt_!,
            status: transactions[7].receipt_!.status == '0x1' ? '0x0' : '0x1',
        }

        let stream = new FakeStream().put(forge(block, {transactions}), {components: tag})
        let res = await walk(verifiedRequest(stream, block, {withReceipts: true}))

        expect(res.miss).toBeUndefined()
    })

    it('misses on a forged transaction', async () => {
        let block = loadMainnetBlock()

        let transactions = block.transactions.map((tx) => ({...tx}))
        transactions[3].value = '0xde0b6b3a7640000'

        let stream = new FakeStream().put(forge(block, {transactions}), {components: tag})
        let res = await walk(verifiedRequest(stream, block))

        expect(res.miss).toMatchObject({reason: 'verify', details: 'failed to verify transactions root'})
    })

    it('misses on forged logs', async () => {
        let block = loadMainnetBlock()
        let logs = block.transactions.flatMap((tx) => tx.receipt_!.logs)

        let transactions = block.transactions.map((tx) => {
            let {receipt_, ...rest} = tx
            return rest
        })

        let logOptions = {verifyLogsBloom: true}
        let rule = getComponentsRule(logOptions)
        let verify = createLineVerifier(testChainUtils, logOptions)

        let real = forge(block, {transactions, logs_: logs})
        // the bloom of a busy block is nearly full, a single junk address would likely go unnoticed
        let forgedLogs = logs.map((log, i) => ({...log, address: makeHash(`junk:${i}`).slice(0, 42)}))
        let forged = forge(real, {logs_: forgedLogs})

        for (let [line, reason] of [
            [real, undefined],
            [forged, 'verify'],
        ] as const) {
            let stream = new FakeStream().put(line, {components: 'logs,v-logs-bloom'})
            let res = await walk({
                ...request(stream, Number(block.number), linkOf(block)),
                rule,
                verify,
            })

            expect(res.miss?.reason).toBe(reason)
        }
    })

    it('does not take a header hashed with a rule of another chain', async () => {
        let block = loadMainnetBlock()
        let stream = new FakeStream().put(block, {components: tag})

        let avalanche = new ChainUtils('0xa86a')
        let res = await walk({
            ...verifiedRequest(stream, block),
            verify: createLineVerifier(avalanche, options),
        })

        expect(res.miss).toMatchObject({reason: 'hash'})
    })
})

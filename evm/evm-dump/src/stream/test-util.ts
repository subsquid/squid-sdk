import type {RawBlock} from '@subsquid/evm-normalization'
import {ChainUtils} from '@subsquid/evm-rpc'
import {createHash} from 'crypto'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import {type BlockLink, getPayloadCrc, RAW_LINE_SCHEMA, type StreamMessage} from './message'
import {createLineVerifier} from './verify'
import type {DirectGet} from './walk'

export function makeHash(seed: string): string {
    return '0x' + createHash('sha256').update(seed).digest('hex')
}

export const testChainUtils = new ChainUtils('0x1')

const ZERO_HASH = '0x' + '00'.repeat(32)
const EMPTY_TRIE_ROOT = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
const EMPTY_UNCLES_HASH = '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'

/**
 * A block without transactions, whose hash is the real hash of its header
 */
export function makeChildBlock(parent: RawBlock | undefined, branch = 'main'): RawBlock {
    let number = parent ? Number(parent.number) + 1 : 0

    let block = {
        number: '0x' + number.toString(16),
        hash: ZERO_HASH,
        parentHash: parent ? parent.hash : ZERO_HASH,
        sha3Uncles: EMPTY_UNCLES_HASH,
        miner: '0x' + '00'.repeat(20),
        stateRoot: makeHash(`state:${branch}:${number}`),
        transactionsRoot: EMPTY_TRIE_ROOT,
        receiptsRoot: EMPTY_TRIE_ROOT,
        logsBloom: '0x' + '00'.repeat(256),
        difficulty: '0x0',
        gasLimit: '0x1c9c380',
        gasUsed: '0x0',
        timestamp: '0x' + (1_700_000_000 + number).toString(16),
        extraData: '0x' + Buffer.from(branch).toString('hex'),
        mixHash: ZERO_HASH,
        nonce: '0x0000000000000000',
        size: '0x200',
        transactions: [],
        uncles: [],
        logs_: [],
    } as unknown as RawBlock

    return withRealHash(block)
}

export function withRealHash(block: RawBlock): RawBlock {
    return {
        ...block,
        hash: testChainUtils.calculateBlockHash(block),
    }
}

const blocks = new Map<string, RawBlock>()

/**
 * The block of a branch at the given height. `parentBranch` makes it the first block of a fork.
 */
export function makeBlock(number: number, branch = 'main', parentBranch = branch): RawBlock {
    let key = `${number}:${branch}:${parentBranch}`

    let block = blocks.get(key)
    if (block == null) {
        let parent = number > 0 ? makeBlock(number - 1, parentBranch) : undefined
        block = makeChildBlock(parent, branch)
        blocks.set(key, block)
    }

    return structuredClone(block)
}

export function makeChain(from: number, to: number, branch = 'main'): RawBlock[] {
    let blocks: RawBlock[] = []
    for (let n = from; n <= to; n++) {
        blocks.push(makeBlock(n, branch))
    }
    return blocks
}

export const verifyTestLine = createLineVerifier(testChainUtils, {})

/**
 * A mainnet block with its receipts, the way a dumper running `--with-receipts` writes it
 */
export function loadMainnetBlock(): RawBlock {
    let dir = path.resolve(__dirname, '../../../evm-rpc/test/fixtures/ethereum/18000000')
    let block = JSON.parse(fs.readFileSync(path.join(dir, 'block.json'), 'utf-8'))
    let receipts = JSON.parse(fs.readFileSync(path.join(dir, 'receipts.json'), 'utf-8'))

    for (let i = 0; i < block.transactions.length; i++) {
        block.transactions[i].receipt_ = receipts[i]
    }

    return block
}

export function makeMessage(block: RawBlock, headers: Record<string, string> = {}): StreamMessage {
    let line = JSON.stringify(block) + '\n'
    let data = zlib.zstdCompressSync(Buffer.from(line))

    let all = new Map(
        Object.entries({
            hash: block.hash,
            parent_hash: block.parentHash,
            parent_number: String(Number(block.number) - 1),
            components: 'logs',
            schema: RAW_LINE_SCHEMA,
            feed: 'test',
            payload_crc32: getPayloadCrc(data),
            ...headers,
        }),
    )

    return {
        headers: {
            get: (name) => all.get(name),
        },
        data,
    }
}

export class TimeoutError extends Error {
    get name(): string {
        return 'TimeoutError'
    }
}

/**
 * In-memory stream, that holds one message per (number, hash)
 */
export class FakeStream {
    private messages = new Map<string, StreamMessage>()
    private failures = new Map<string, Error>()
    public requests: BlockLink[] = []
    /**
     * Makes every request fail, the way a stream without direct access does
     */
    public failure?: Error

    put(block: RawBlock, headers?: Record<string, string>): this {
        return this.putMessage(block, makeMessage(block, headers))
    }

    putMessage(block: RawBlock, msg: StreamMessage): this {
        this.messages.set(key({number: Number(block.number), hash: block.hash}), msg)
        return this
    }

    putChain(blocks: RawBlock[]): this {
        for (let block of blocks) {
            this.put(block)
        }
        return this
    }

    remove(block: RawBlock): this {
        this.messages.delete(key({number: Number(block.number), hash: block.hash}))
        return this
    }

    fail(block: RawBlock, err: Error): this {
        this.failures.set(key({number: Number(block.number), hash: block.hash}), err)
        return this
    }

    get: DirectGet = async (block) => {
        this.requests.push(block)

        let failure = this.failure ?? this.failures.get(key(block))
        if (failure) throw failure

        return this.messages.get(key(block))
    }
}

function key(block: BlockLink): string {
    return `${block.number}.${block.hash}`
}

export function linkOf(block: RawBlock): BlockLink {
    return {
        number: Number(block.number),
        hash: block.hash,
    }
}

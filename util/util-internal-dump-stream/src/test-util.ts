import {createHash} from 'node:crypto'
import zlib from 'node:zlib'
import {type BlockLink, getPayloadCrc, type LineFormat, type StreamMessage} from './message'
import type {RpcBatch, RpcSource} from './source'
import type {DirectGet, LineVerifier} from './walk'

/**
 * A block of a chain with case sensitive hashes
 */
export interface ToyBlock {
    slot: number
    hash: string
    parentHash: string
    parentSlot: number
}

const GENESIS_PARENT = 'A'.repeat(43)

function hashOf(slot: number, parentHash: string): string {
    return createHash('sha256').update(`${slot}:${parentHash}`).digest('base64url')
}

export function makeChain(from: number, to: number): ToyBlock[] {
    let blocks: ToyBlock[] = []
    let parentHash = GENESIS_PARENT

    for (let slot = from; slot <= to; slot++) {
        let hash = hashOf(slot, parentHash)
        blocks.push({slot, hash, parentHash, parentSlot: slot - 1})
        parentHash = hash
    }

    return blocks
}

export function getLineSize(block: ToyBlock): number {
    return JSON.stringify(block).length + 1
}

export const toyFormat: LineFormat<ToyBlock> = {
    schema: 'toy-raw-line-zstd/1',
    rule: {
        known: new Set(['blocks', 'uncles']),
        exact: new Map([['blocks', true]]),
    },
    isHash: (value) => /^[\w-]{43}$/.test(value),
    getRef(block) {
        if (typeof block.slot != 'number') return undefined

        return {
            number: block.slot,
            hash: block.hash,
            parentHash: block.parentHash,
        }
    },
}

export const verifyToyLine: LineVerifier<ToyBlock> = async (block, expected) => {
    let hash = hashOf(block.slot, block.parentHash)
    if (hash !== expected.hash) return {reason: 'hash', details: `the block hashes to ${hash}`}
}

export function linkOf(block: ToyBlock): BlockLink {
    return {
        number: block.slot,
        hash: block.hash,
    }
}

export function makeMessage(block: ToyBlock, headers: Record<string, string> = {}): StreamMessage {
    let data = zlib.zstdCompressSync(Buffer.from(`${JSON.stringify(block)}\n`))

    let all = new Map(
        Object.entries({
            hash: block.hash,
            parent_hash: block.parentHash,
            parent_number: String(block.parentSlot),
            components: 'blocks',
            schema: toyFormat.schema,
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

export class FakeStream {
    private messages = new Map<string, StreamMessage>()
    public requests: BlockLink[] = []

    putChain(blocks: ToyBlock[]): this {
        for (let block of blocks) {
            this.messages.set(key(linkOf(block)), makeMessage(block))
        }
        return this
    }

    remove(block: ToyBlock): this {
        this.messages.delete(key(linkOf(block)))
        return this
    }

    get: DirectGet = async (block) => {
        this.requests.push(block)
        return this.messages.get(key(block))
    }
}

function key(block: BlockLink): string {
    return `${block.number}.${block.hash}`
}

/**
 * Serves a finalized chain in batches of two
 */
export class FakeRpc implements RpcSource<ToyBlock> {
    public bodyRequests: {from: number; to?: number; parentHash?: string}[] = []

    constructor(private chain: ToyBlock[]) {}

    async getFinalizedHead(): Promise<BlockLink> {
        return linkOf(this.chain[this.chain.length - 1])
    }

    async getBlockHash(number: number): Promise<string | undefined> {
        return this.chain.find((b) => b.slot == number)?.hash
    }

    async *getBlocks(range: {from: number; to?: number}, parentHash?: string): AsyncIterable<RpcBatch<ToyBlock>> {
        this.bodyRequests.push({...range, parentHash})

        let end = range.to ?? Number.POSITIVE_INFINITY
        let blocks = this.chain.filter((b) => b.slot >= range.from && b.slot <= end)
        let finalizedHead = this.chain[this.chain.length - 1].slot

        for (let i = 0; i < blocks.length; i += 2) {
            yield {blocks: blocks.slice(i, i + 2), finalizedHead}
        }
    }
}

/**
 * A programmable EVM JSON-RPC endpoint for reorg tests.
 *
 * Serves a generated chain over real HTTP, so the code under test runs its production path: the
 * RPC client, request batching, response validation and the data source on top. Unlike a node such
 * as Anvil, the chain can be rewritten to order and identically on every run: {@link MockEvmRpc.reorg}
 * replaces the top blocks with a new branch of any length, shorter or longer than the one it drops.
 *
 * Block hashes are derived from the branch and the height, so a replacement block is a different
 * block with a different hash. Blocks of abandoned branches stay retrievable by hash, as on a real
 * node. Methods the mock does not implement are answered with `-32601` and recorded in
 * {@link MockEvmRpc.unsupportedMethods}: a test should assert that set is empty, so a gap in the mock
 * fails as a gap rather than passing for a bug in the code under test.
 */

import {createHash} from 'node:crypto'
import {type JsonRpcReply, type JsonRpcRequest, serveJsonRpc} from './json-rpc-server'

export interface MockEvmBlock {
    number: number
    hash: string
    parentHash: string
    /** Branch the block was produced on; `0` is the original chain. */
    branch: number
}

export interface MockEvmRpcOptions {
    chainId?: number
    /** Blocks between the head and the `finalized` / `safe` tags. Default `0`. */
    finalizedLag?: number
}

const ZERO32 = '0x' + '00'.repeat(32)
const EMPTY_TRIE = '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421'
const EMPTY_UNCLES = '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347'

function blockHash(branch: number, number: number): string {
    return '0x' + createHash('sha256').update(`mock-evm-rpc/${branch}/${number}`).digest('hex')
}

function toQty(n: number): string {
    return '0x' + n.toString(16)
}

export class MockEvmRpc {
    /** The canonical chain, genesis first. */
    readonly chain: MockEvmBlock[] = []
    /** Every block ever produced, by hash, including abandoned branches. */
    private known = new Map<string, MockEvmBlock>()
    private branchCounter = 0
    /** Branch new blocks are mined on: the latest reorg's, even when it added no blocks. */
    private currentBranch = 0
    private closeServer?: () => Promise<void>
    private chainId: number
    finalizedLag: number

    /** JSON-RPC methods called, with counts. */
    readonly calls = new Map<string, number>()
    /** Methods that were called but are not implemented by the mock. */
    readonly unsupportedMethods = new Set<string>()
    /** Block tags (`latest`, `finalized`, ...) requested from `eth_getBlockByNumber`, with counts. */
    readonly tags = new Map<string, number>()

    constructor(options: MockEvmRpcOptions = {}) {
        this.chainId = options.chainId ?? 31337
        this.finalizedLag = options.finalizedLag ?? 0
        this.append(0, 0, ZERO32)
    }

    get head(): MockEvmBlock {
        return this.chain[this.chain.length - 1]
    }

    /** Hash of the canonical block at `number`. */
    hashAt(number: number): string {
        let block = this.chain[number]
        if (block == null) throw new Error(`no canonical block at ${number}`)
        return block.hash
    }

    /** Append `count` blocks to the canonical chain, on its current branch. */
    mine(count = 1): void {
        for (let i = 0; i < count; i++) {
            let parent = this.head
            this.append(parent.number + 1, this.currentBranch, parent.hash)
        }
    }

    /** Mine until the head is at `number`. */
    mineTo(number: number): void {
        if (number > this.head.number) this.mine(number - this.head.number)
    }

    /**
     * Replace the top `depth` blocks with `length` (default `depth`) blocks of a new branch. The new
     * branch forks from the block at `head - depth`, which stays canonical. Returns that block.
     */
    reorg({depth, length = depth}: {depth: number; length?: number}): MockEvmBlock {
        if (depth < 1 || depth >= this.chain.length) throw new Error(`invalid reorg depth ${depth}`)
        this.chain.length -= depth
        let base = this.head
        // Mining continues on the new branch even if it starts empty (`length: 0`); otherwise the
        // next block would recreate an abandoned one, hash included, and the reorg would vanish.
        this.currentBranch = ++this.branchCounter
        this.mine(length)
        return base
    }

    async listen(): Promise<string> {
        let {url, close} = await serveJsonRpc((request) => this.handle(request))
        this.closeServer = close
        return url
    }

    async close(): Promise<void> {
        let close = this.closeServer
        this.closeServer = undefined
        await close?.()
    }

    private append(number: number, branch: number, parentHash: string): void {
        let block: MockEvmBlock = {number, hash: blockHash(branch, number), parentHash, branch}
        this.chain.push(block)
        this.known.set(block.hash, block)
    }

    private handle({method, params = []}: JsonRpcRequest): JsonRpcReply {
        this.calls.set(method, (this.calls.get(method) ?? 0) + 1)
        switch (method) {
            case 'eth_chainId':
                return {result: toQty(this.chainId)}
            case 'eth_blockNumber':
                return {result: toQty(this.head.number)}
            case 'eth_getBlockByNumber':
                return {result: this.blockByTag(params[0] as string)}
            case 'eth_getBlockByHash': {
                let block = this.known.get(params[0] as string)
                return {result: block ? this.toJson(block) : null}
            }
            default:
                this.unsupportedMethods.add(method)
                return {error: {code: -32601, message: `the method ${method} does not exist`}}
        }
    }

    private blockByTag(tag: string): unknown {
        if (!tag.startsWith('0x')) this.tags.set(tag, (this.tags.get(tag) ?? 0) + 1)
        let number: number
        switch (tag) {
            case 'latest':
            case 'pending':
                number = this.head.number
                break
            case 'finalized':
            case 'safe':
                number = Math.max(0, this.head.number - this.finalizedLag)
                break
            case 'earliest':
                number = 0
                break
            default:
                number = Number.parseInt(tag, 16)
        }
        let block = this.chain[number]
        return block ? this.toJson(block) : null
    }

    private toJson(block: MockEvmBlock): unknown {
        return {
            number: toQty(block.number),
            hash: block.hash,
            parentHash: block.parentHash,
            difficulty: '0x0',
            extraData: '0x',
            gasLimit: '0x1c9c380',
            gasUsed: '0x0',
            sha3Uncles: EMPTY_UNCLES,
            logsBloom: '0x' + '00'.repeat(256),
            transactionsRoot: EMPTY_TRIE,
            receiptsRoot: EMPTY_TRIE,
            stateRoot: blockHash(block.branch + 1_000_000, block.number),
            miner: '0x' + '00'.repeat(20),
            mixHash: ZERO32,
            nonce: '0x0000000000000000',
            baseFeePerGas: '0x1',
            size: '0x220',
            timestamp: toQty(1_700_000_000 + block.number * 2),
            transactions: [],
            uncles: [],
        }
    }
}

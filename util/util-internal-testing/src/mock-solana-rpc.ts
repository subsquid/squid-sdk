/**
 * A programmable Solana JSON-RPC endpoint for reorg tests - the Solana counterpart of
 * {@link MockEvmRpc}. Serves a generated chain of slots over real HTTP; slots can be skipped, and
 * {@link MockSolanaRpc.reorg} replaces the top blocks with a new branch of any length.
 *
 * Block hashes are base58 and derived from the branch and the slot, so a replacement block is a
 * different block. Methods the mock does not implement are answered with `-32601` and recorded in
 * {@link MockSolanaRpc.unsupportedMethods}; a test should assert that set is empty.
 */

import {createHash} from 'node:crypto'
import {type JsonRpcReply, type JsonRpcRequest, serveJsonRpc} from './json-rpc-server'

export interface MockSolanaBlock {
    slot: number
    blockhash: string
    parentSlot: number
    previousBlockhash: string
    blockHeight: number
    branch: number
}

export interface MockSolanaRpcOptions {
    /** Blocks between the `confirmed` head and the `finalized` one. Default `0`. */
    finalizedLag?: number
}

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function base58(bytes: Uint8Array): string {
    let n = BigInt('0x' + Buffer.from(bytes).toString('hex'))
    let out = ''
    while (n > 0n) {
        out = B58_ALPHABET[Number(n % 58n)] + out
        n /= 58n
    }
    for (let b of bytes) {
        if (b !== 0) break
        out = '1' + out
    }
    return out
}

function blockhash(branch: number, slot: number): string {
    return base58(createHash('sha256').update(`mock-solana-rpc/${branch}/${slot}`).digest())
}

export class MockSolanaRpc {
    /** The canonical chain, genesis first (slots ascending, possibly with gaps). */
    readonly chain: MockSolanaBlock[] = []
    private bySlot = new Map<number, MockSolanaBlock>()
    private branchCounter = 0
    private currentBranch = 0
    private closeServer?: () => Promise<void>
    finalizedLag: number

    /** JSON-RPC methods called, with counts. */
    readonly calls = new Map<string, number>()
    /** Methods that were called but are not implemented by the mock. */
    readonly unsupportedMethods = new Set<string>()

    constructor(options: MockSolanaRpcOptions = {}) {
        this.finalizedLag = options.finalizedLag ?? 0
        this.append(0, base58(new Uint8Array(32)), 0)
    }

    get head(): MockSolanaBlock {
        return this.chain[this.chain.length - 1]
    }

    /** Hash of the canonical block at `slot`, or `undefined` if the slot was skipped. */
    hashAt(slot: number): string | undefined {
        return this.bySlot.get(slot)?.blockhash
    }

    /** Append `count` blocks, each `skip` slots after its parent's next slot. */
    mine(count = 1, {skip = 0}: {skip?: number} = {}): void {
        for (let i = 0; i < count; i++) {
            let parent = this.head
            this.append(parent.slot + 1 + skip, parent.blockhash, parent.slot)
        }
    }

    /** Mine single-slot blocks until the head is at `slot`. */
    mineTo(slot: number): void {
        while (this.head.slot < slot) this.mine()
    }

    /**
     * Replace the top `depth` blocks with `length` (default `depth`) blocks of a new branch, forked
     * from the block below them, which stays canonical and is returned. The new blocks start one slot
     * after the fork point, so they reuse the slots of the replaced ones.
     */
    reorg({depth, length = depth}: {depth: number; length?: number}): MockSolanaBlock {
        if (depth < 1 || depth >= this.chain.length) throw new Error(`invalid reorg depth ${depth}`)
        for (let b of this.chain.splice(this.chain.length - depth)) this.bySlot.delete(b.slot)
        let base = this.head
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

    private append(slot: number, previousBlockhash: string, parentSlot: number): void {
        let parent = this.chain[this.chain.length - 1]
        let block: MockSolanaBlock = {
            slot,
            blockhash: blockhash(this.currentBranch, slot),
            parentSlot,
            previousBlockhash,
            blockHeight: parent ? parent.blockHeight + 1 : 0,
            branch: this.currentBranch,
        }
        this.chain.push(block)
        this.bySlot.set(slot, block)
    }

    /** The highest slot visible at a commitment level. */
    private topSlot(commitment: unknown): number {
        if (commitment === 'finalized') {
            return this.chain[Math.max(0, this.chain.length - 1 - this.finalizedLag)].slot
        }
        return this.head.slot
    }

    private handle({method, params = []}: JsonRpcRequest): JsonRpcReply {
        this.calls.set(method, (this.calls.get(method) ?? 0) + 1)
        switch (method) {
            case 'getLatestBlockhash': {
                let top = this.topSlot((params[0] as any)?.commitment)
                return {
                    result: {
                        context: {slot: top},
                        value: {blockhash: this.bySlot.get(top)!.blockhash, lastValidBlockHeight: top + 150},
                    },
                }
            }
            case 'getBlocks': {
                let [start, end, config] = params as [number, number, any]
                let top = Math.min(end, this.topSlot(config?.commitment))
                return {result: this.chain.filter((b) => b.slot >= start && b.slot <= top).map((b) => b.slot)}
            }
            case 'getBlocksWithLimit': {
                let [start, limit, config] = params as [number, number, any]
                let top = this.topSlot(config?.commitment)
                let slots = this.chain.filter((b) => b.slot >= start && b.slot <= top).map((b) => b.slot)
                return {result: slots.slice(0, limit)}
            }
            case 'getBlock': {
                let [slot, config] = params as [number, any]
                let block = this.bySlot.get(slot)
                if (block == null || slot > this.topSlot(config?.commitment)) {
                    return slot <= this.head.slot && block == null
                        ? {
                              error: {
                                  code: -32007,
                                  message: `Slot ${slot} was skipped, or missing due to ledger jump to recent snapshot`,
                              },
                          }
                        : {error: {code: -32004, message: `Block not available for slot ${slot}`}}
                }
                let result: Record<string, unknown> = {
                    blockHeight: block.blockHeight,
                    blockTime: 1_700_000_000 + block.slot,
                    blockhash: block.blockhash,
                    parentSlot: block.parentSlot,
                    previousBlockhash: block.previousBlockhash,
                }
                if (config?.transactionDetails !== 'none') result.transactions = []
                if (config?.rewards !== false) result.rewards = []
                return {result}
            }
            default:
                this.unsupportedMethods.add(method)
                return {error: {code: -32601, message: `the method ${method} does not exist`}}
        }
    }
}

import {Block as NormalizedBlock} from '@subsquid/solana-normalization'
import {Block, FieldSelection, mapBlock} from '@subsquid/solana-stream'
import {solana} from '@subsquid/portal-client'
import {toJSON} from '@subsquid/util-internal-json'
import {cast} from '@subsquid/util-internal-validation'

/**
 * The Portal source's field-selection augmentation: every item's *required* fields are forced on
 * regardless of the user selection, so the decoded items always carry their identity/navigation
 * keys. Mirrors the (private) `mapFieldSelection` of `@subsquid/solana-stream`'s Portal source —
 * kept in sync by the parity e2e test.
 */
export function mapFieldSelection(fields: FieldSelection) {
    return {
        block: fields.block,
        transaction: {...fields.transaction, transactionIndex: true},
        instruction: {...fields.instruction, transactionIndex: true, instructionAddress: true},
        log: {...fields.log, logIndex: true, transactionIndex: true, instructionAddress: true},
        balance: {...fields.balance, transactionIndex: true, account: true},
        tokenBalance: {...fields.tokenBalance, transactionIndex: true, account: true},
        reward: {...fields.reward, pubkey: true},
    } satisfies solana.FieldSelection
}

export type MapFieldSelection = ReturnType<typeof mapFieldSelection>

/**
 * Decode an already-serialized wire block (the `toJSON` of a normalized block) into the
 * Portal `Block<F>` model by reusing the **exact** Portal decoder: the shared
 * `getBlockSchema`/`patchQueryFields` + `cast`, then the Portal source's exported `mapBlock`.
 * Reusing the producer's decoder is what makes the RPC source's output byte-identical to the
 * Portal source's (including its `timestamp` seconds→ms conversion).
 */
export function decodeWireBlock<F extends FieldSelection>(wire: unknown, fields: F): Block<F> {
    let schema = solana.getBlockSchema(solana.patchQueryFields(mapFieldSelection(fields)))
    let decoded = cast(schema, wire) as solana.Block<MapFieldSelection>

    return mapBlock<F>(decoded)
}

/**
 * Decode a normalized RPC block (`mapRpcBlock` output) into the Portal `Block<F>` model.
 */
export function decodeBlock<F extends FieldSelection>(block: NormalizedBlock, fields: F): Block<F> {
    return decodeWireBlock(toJSON(block), fields)
}

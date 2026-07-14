import {Block as NormalizedBlock} from '@subsquid/evm-normalization'
import {Block, FieldSelection} from '@subsquid/evm-stream'
import {evm} from '@subsquid/portal-client'
import {toJSON} from '@subsquid/util-internal-json'
import {cast} from '@subsquid/util-internal-validation'

import {MapFieldSelection, mapBlock, mapFieldSelection} from './portal-map'
import {shimWireBlock} from './shim'

/**
 * Decode an already-serialized wire block (the `toJSON` of a normalized block) into the
 * Portal `Block<F>` model by reusing the **exact** Portal decoder: the shared
 * `getBlockSchema`/`patchQueryFields` + `cast`, then `mapBlock`. A small pre-cast shim
 * reshapes the two trace-level fields the schema rejects. Reusing the producer's decoder
 * is what makes the RPC source's output byte-identical to the Portal source's.
 */
export function decodeWireBlock<F extends FieldSelection>(wire: unknown, fields: F): Block<F> {
    let shaped = shimWireBlock(wire)
    let schema = evm.getBlockSchema(evm.patchQueryFields(mapFieldSelection(fields)))
    let decoded = cast(schema, shaped) as evm.Block<MapFieldSelection>

    return mapBlock<F>(decoded)
}

/**
 * Decode a normalized RPC block (`mapRpcBlock` output) into the Portal `Block<F>` model.
 */
export function decodeBlock<F extends FieldSelection>(block: NormalizedBlock, fields: F): Block<F> {
    return decodeWireBlock(toJSON(block), fields)
}

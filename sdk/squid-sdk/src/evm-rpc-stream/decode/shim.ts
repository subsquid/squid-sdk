/**
 * Reshape `toJSON(normalized)` wire JSON so the Portal `getBlockSchema` tagged-union
 * accepts it. The normalized model (`@subsquid/evm-normalization`) and the Portal wire
 * schema (`@subsquid/portal-client`) are the same SQD EVM schema except for two enumerable
 * trace-level differences (verified: `evm-normalization/data.ts` vs
 * `portal-client/query/evm/schema.ts`):
 *
 *  - **suicide tag** — normalized emits trace `type: 'selfdestruct'`, the schema's
 *    tagged-union keys the variant `'suicide'`. (The action fields
 *    `address`/`refundAddress`/`balance` already match.)
 *  - **reward action field** — normalized stores the reward kind as `action.rewardType`,
 *    the schema reads it as `action.type`.
 *
 * Without this, `cast(getBlockSchema(...))` would reject the wire. Mutates in place — it
 * runs on fresh `toJSON` output. `height` and `timestamp` units are NOT shim concerns:
 * `mapBlock` handles them after the cast.
 */
export function shimWireBlock(block: any): any {
    let traces = block?.traces
    if (Array.isArray(traces)) {
        for (let trace of traces) {
            if (trace.type === 'selfdestruct') {
                trace.type = 'suicide'
            } else if (trace.type === 'reward' && trace.action && 'rewardType' in trace.action) {
                trace.action.type = trace.action.rewardType
                delete trace.action.rewardType
            }
        }
    }

    return block
}

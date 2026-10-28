import type {RawBlock} from '@subsquid/evm-normalization'
import type {LineFormat} from '@subsquid/util-internal-dump-stream'
import {type ComponentOptions, getComponentsRule} from './components'

export const RAW_LINE_SCHEMA = 'evm-raw-line-zstd/1'

export function getLineFormat(options: ComponentOptions): LineFormat<RawBlock> {
    return {
        schema: RAW_LINE_SCHEMA,
        rule: getComponentsRule(options),
        isHash: (value) => /^0x[0-9a-f]+$/.test(value),
        normalizeHash: (hash) => hash.toLowerCase(),
        getRef(block) {
            if (typeof block.number != 'string') return undefined

            return {
                number: Number(block.number),
                hash: block.hash,
                parentHash: block.parentHash,
            }
        },
    }
}

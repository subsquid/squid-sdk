import type {Range} from '@subsquid/util-internal-processor-tools'


export interface DataSource {
    /**
     * Subsquid substrate archive endpoint URL
     */
    archive: string
    /**
     * Chain node RPC endpoint URL
     */
    chain?: string
}


export interface BlockRangeOption {
    range?: Range
}


export interface EvmLogOptions extends BlockRangeOption {
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet[]
}


export interface AcalaEvmLogFilter {
    contract?: string
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet[]
}


export interface AcalaEvmExecutedOptions extends BlockRangeOption {
    /**
     * When specified, instructs to include only events
     * which contain at least one EVM log record
     * matching one of the provided filters.
     */
    logs?: AcalaEvmLogFilter[]
}


export type EvmTopicSet = string | null | undefined | string[]

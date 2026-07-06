import {NetworkPreset} from './types'

/**
 * Cronos mainnet (Ethermint). Block-hash, tx-root and receipts-root verification are skipped
 * (Ethermint headers don't satisfy them); tx-sender and logs-bloom are verified. Traces and state
 * diffs are not part of this dataset.
 *
 * NOTE: Cronos has a phantom-transaction quirk handled inside `@subsquid/evm-rpc`
 * (`handleCronosPhantomTransactions`); this preset only carries the deploy-config layer.
 */
export const cronosMainnet: NetworkPreset = {
    slug: 'cronos-mainnet',
    chainId: 25,
    family: 'ethermint',
    rpc: {
        verifyTxSender: true,
        verifyLogsBloom: true,
    },
    method: {},
}

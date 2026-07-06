import {NetworkPreset} from './types'

/**
 * Gnosis mainnet (AuRa). Uses the `trace_` API; tx-sender and tx-root verification are skipped
 * (AuRa system transactions don't satisfy them). Block hash, receipts root and logs bloom verified.
 */
export const gnosisMainnet: NetworkPreset = {
    slug: 'gnosis-mainnet',
    chainId: 100,
    family: 'aura',
    rpc: {
        verifyBlockHash: true,
        verifyReceiptsRoot: true,
        verifyLogsBloom: true,
    },
    method: {useTraceApi: true},
}

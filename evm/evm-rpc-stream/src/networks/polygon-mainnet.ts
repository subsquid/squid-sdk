import {NetworkPreset} from './types'

/**
 * Polygon mainnet (Bor). Tx-sender verification is skipped (Bor state-sync "system" transactions
 * have no recoverable sender), and finality uses a fixed 500-block confirmation depth. The dataset
 * carries traces but not state diffs.
 */
export const polygonMainnet: NetworkPreset = {
    slug: 'polygon-mainnet',
    chainId: 137,
    family: 'bor',
    rpc: {
        verifyBlockHash: true,
        verifyTxRoot: true,
        verifyReceiptsRoot: true,
        verifyLogsBloom: true,
        finalityConfirmation: 500,
    },
    method: {},
}

import {describe, it, expect} from 'vitest'
import {cast} from '@subsquid/util-internal-validation'
import {Transaction} from './rpc-data'

// Real optimism-mainnet block 0x93570f5 tx[0] as returned by Alchemy: an
// OP-stack deposit transaction (type 0x7e). Alchemy omits the `nonce` field
// for these system transactions (Dwellir/geth include it), so the validator
// must treat `nonce` as optional or it crashes the dumper on every OP block.
const ALCHEMY_DEPOSIT_TX = {
    type: '0x7e',
    sourceHash: '0x74e8e903225d29359d3e2b53682e28da2e415872533659255f28951e4e1c3af1',
    from: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001',
    to: '0x4200000000000000000000000000000000000015',
    mint: '0x0',
    value: '0x0',
    gas: '0xf4240',
    input: '0x3db6be2b0000146b000f79c50000000000000003000000006a5ebb53000000000186480000000000000000000000000000000000000000000000000000000000045488f6000000000000000000000000000000000000000000000000000000000039ef561076949313403c81113fe7b7de83f0e1686e0df1afbfd2112469530562d0bb8e0000000000000000000000006887246668a3b87f54deb3b94ba47a6f63f329850000000000000000000000000190',
    hash: '0x0ba6943635ddd8ea164cd7945dd35f69a2ca6dab7b58bdf23ca1512c30d950ad',
    r: '0x0',
    s: '0x0',
    yParity: '0x0',
    v: '0x0',
    blockHash: '0x0607985081d5cd537cd4ab5fb7159cf6d1e92d5009c6cb03a617d4240ee03b4d',
    blockNumber: '0x93570f5',
    transactionIndex: '0x0',
    blockTimestamp: '0x6a5ebba3',
    gasPrice: '0x0',
    // note: no `nonce`
}

describe('Transaction validation', () => {
    it('accepts an OP-stack deposit tx (0x7e) that omits nonce', () => {
        const tx = cast(Transaction, ALCHEMY_DEPOSIT_TX)
        expect(tx.type).toBe(0x7e)
        expect(tx.nonce).toBeUndefined()
    })

    it('still parses nonce when present', () => {
        const tx = cast(Transaction, {...ALCHEMY_DEPOSIT_TX, nonce: '0x2efae9e'})
        expect(tx.nonce).toBe(0x2efae9e)
    })
})

import type * as rpc from '@subsquid/evm-rpc'
import {describe, expect, it} from 'vitest'
import {mapRpcBlock} from './mapping'


// Ethereum Sepolia block 11319411, transaction 17
// (0xf6c6e39b79667c78858e4c5b924a22d834427d7287e8a3b26219fe5dce180065).
//
// The transaction self-destructs a contract into itself. Some providers return that
// frame with `from` zeroed and `to`/`value` dropped; others return it intact. Nothing
// upstream of normalization can tell the two apart: debug traces carry no consensus
// root, and `DebugFrame` declares `to` optional and `from` as any hex string, so the
// broken frame passes RPC-level validation and gets written to the raw archive as-is.
//
// It happened on 2026-07-21 and stalled ethereum-sepolia ingestion for a week: the
// block is re-read from the archive on every retry, so the failure is permanent and
// the same assertion fires forever.
//
// The header is real, with the withdrawals list truncated.
const BLOCK_HEADER = {
    "baseFeePerGas": "0x3fb95022",
    "blobGasUsed": "0xc0000",
    "difficulty": "0x0",
    "excessBlobGas": "0xc7a5bd7",
    "extraData": "0x4e65746865726d696e642076312e33382e31",
    "gasLimit": "0x3938700",
    "gasUsed": "0xe0e9d6",
    "hash": "0xb3cd8c881cd3fc3b4385e9d0b03ed54394ef9a23dba108e389448e249441f5a2",
    "logsBloom": "0x44a80c64d486ca020c9881e2d3165259d8c0a2408981051528b14014042205f0440820f25484e3508322c01b3ab640f4c119a100180c682a0943120a4a250c85420140c04104214c48800c0ad208062804415cdc44598412828608008c2686580280d4923a3e8570834300c904514c40660803c2ae1f1421000096b94d5ea047c347088900174919091a0800121020e009a00a4143ced81c00650a5201cd0204868038053f44211046456920000d051c008408d18c200a0d80b0c3b7001b0940630814223548a042394b1049496712eac2742b34654e9cb9c6142162540a20824511405a58808c8290403016a4a2c001e81a2d1d18952848528870002e481900",
    "miner": "0xc6e2459991bfe27cca6d86722f35da23a1e4cb97",
    "mixHash": "0x9028ada144d0c538172347459302cd61591a7e2770f4f715d6f5d7d34657af1b",
    "nonce": "0x0000000000000000",
    "number": "0xacb873",
    "parentBeaconBlockRoot": "0x89f90c0bcfe4437f90cdc41c81be4f7a7c42b6cbbe3e9202fdb65930805b375b",
    "parentHash": "0x75e2da461c6f17e3d13b5de8d258ec9094804f11cef940ff870a89b031c86ac9",
    "receiptsRoot": "0xfc4f1a5aba44fa323c54e27bf91f86f1cdeb93aaa321f338b7f19cf69eb33226",
    "requestsHash": "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "size": "0xab79",
    "stateRoot": "0x69db707c5b845da7a4694df25857108e0d340cd6ea8513394277bbcf40fa6196",
    "timestamp": "0x6a5f57cc",
    "transactionsRoot": "0x1bf205cf85f92eb74aca1ee7b5eb7fc799742b044196a41a765ff43563b88450",
    "uncles": [],
    "withdrawals": [
        {
            "index": "0x7f106c9",
            "validatorIndex": "0x55c",
            "address": "0x89bb1332db257b983ada216746903be808938da1",
            "amount": "0x35592"
        }
    ],
    "withdrawalsRoot": "0x0bd4a937f2261675e67dafded55a3d09a7ae996fddaef5772ce4a432f3ef8d4c"
} as unknown as rpc.GetBlock

const TRANSACTION = {
    "blockHash": "0xb3cd8c881cd3fc3b4385e9d0b03ed54394ef9a23dba108e389448e249441f5a2",
    "blockNumber": "0xacb873",
    "blockTimestamp": "0x6a5f57cc",
    "from": "0xb31fb3fd1b61e571a9709bc59413950e1abc9926",
    "gas": "0x773d",
    "gasPrice": "0x99217f22",
    "maxFeePerGas": "0xad52a3ff",
    "maxPriorityFeePerGas": "0x59682f00",
    "hash": "0xf6c6e39b79667c78858e4c5b924a22d834427d7287e8a3b26219fe5dce180065",
    "input": "0x00f55d9d000000000000000000000000e22a1e72591acb61ec32a9a1d2a1d0818c2f53e0",
    "nonce": "0x3",
    "to": "0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0",
    "transactionIndex": "0x11",
    "value": "0x0",
    "type": "0x2",
    "accessList": [],
    "chainId": "0xaa36a7",
    "v": "0x0",
    "r": "0xe6ba3127dfc7d1e2120a22cc1136f0fa19c41138ec385a11d9498f576a290a4f",
    "s": "0x27c7a10dd73a698adda6a9846bc31cd153e4ddeadaae8c9539e475ee5335dad5",
    "yParity": "0x0"
} as unknown as rpc.Transaction

const CONTRACT = '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'


function blockWithFrame(frame: rpc.DebugFrame): rpc.Block {
    return {
        number: 11319411,
        hash: BLOCK_HEADER.hash,
        block: {...BLOCK_HEADER, transactions: [TRANSACTION]},
        debugFrames: [{result: frame}]
    }
}


describe('SELFDESTRUCT debug frame', () => {
    it('maps an intact frame', () => {
        let block = blockWithFrame({
            type: 'SELFDESTRUCT',
            from: CONTRACT,
            to: CONTRACT,
            value: '0x0',
            gas: '0x0',
            gasUsed: '0x0',
            input: '0x'
        })

        expect(mapRpcBlock(block, {withTraces: true}).traces).toEqual([
            {
                transactionIndex: 0,
                traceAddress: [],
                subtraces: 0,
                error: undefined,
                revertReason: undefined,
                type: 'selfdestruct',
                action: {
                    address: CONTRACT,
                    refundAddress: CONTRACT,
                    balance: '0x0'
                }
            }
        ])
    })

    it('points at the offending transaction and frame when `to` is missing', () => {
        let block = blockWithFrame({
            type: 'SELFDESTRUCT',
            from: ZERO_ADDRESS,
            gas: '0x0',
            gasUsed: '0x0',
            input: '0x'
        })

        try {
            mapRpcBlock(block, {withTraces: true})
            expect.unreachable('a SELFDESTRUCT frame without `to` was accepted')
        } catch(err: any) {
            expect(err).toMatchObject({
                transactionIndex: 0,
                traceAddress: [],
                frameType: 'SELFDESTRUCT'
            })
        }
    })

    it('locates a frame nested in the call tree', () => {
        let block = blockWithFrame({
            type: 'CALL',
            from: CONTRACT,
            to: CONTRACT,
            gas: '0x0',
            input: '0x',
            calls: [
                {
                    type: 'STATICCALL',
                    from: CONTRACT,
                    to: CONTRACT,
                    gas: '0x0',
                    input: '0x'
                },
                {
                    type: 'SELFDESTRUCT',
                    from: ZERO_ADDRESS,
                    gas: '0x0',
                    input: '0x'
                }
            ]
        })

        try {
            mapRpcBlock(block, {withTraces: true})
            expect.unreachable('a SELFDESTRUCT frame without `to` was accepted')
        } catch(err: any) {
            expect(err).toMatchObject({
                transactionIndex: 0,
                traceAddress: [1],
                frameType: 'SELFDESTRUCT'
            })
        }
    })
})

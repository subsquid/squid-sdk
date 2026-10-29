import type * as rpc from '@subsquid/evm-rpc'
import {toJSON} from '@subsquid/util-internal-json'
import {describe, expect, it} from 'vitest'
import {mapRpcBlock} from './mapping'


// Tempo moderato block 39324103, transaction 0
// (0xc2ca42a16b6828a7c483654b77002b0d11b40e79be468d38db756c1769c4e62f).
//
// A 0x76 transaction whose nonceKey is 2^256 - 1 carries a full u64 nonce, here
// 2^64 - 1. The archive writer reads `nonce` as a u64 number, so the serialized
// block has to hold the exact digits: a JS number rounds them, a bigint turns into
// a string.
const BLOCK_HEADER = {
    "hash": "0xe8fee6471c528f65a929247da39b0658c97efaeb7dba592e584db59fab0caea8",
    "mainBlockGeneralGasLimit": "0x1c9c380",
    "sharedGasLimit": "0x0",
    "timestampMillisPart": "0x3df",
    "parentHash": "0xa7f1473af559678eb353ddba33200ba19422e021c3f60cbee0ebd8b128981bd9",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "miner": "0x0508e50b02d178cb0802f0c286783c7fb0cd2221",
    "stateRoot": "0x7788386b265a0de72a3cf065cc60eb14a7624dd3fb8baf9e890f8b65348fb452",
    "transactionsRoot": "0x75823a8f3af7ccc42b4b55d694b9a0e5efd42aebcef7ececc48b006bf3c34a82",
    "receiptsRoot": "0x334c91cc1d510ec2403a4e22f52c6703eb2edec8c02293ae6c200e4b35b872c4",
    "logsBloom": "0x00000000000000080000040080000000000000000000800000000000008000000000002002000000000080004100000000000200000000000000000000040004200004000000400000000008000000200000000200042000000000000400000000000000020000020000800040000a00000002000000000000000010000000020000000004000000000000000020000500000000800000000000808000000000000020000001000004000000000800000000000000000000000000000000000000000002000004000000000000000000000001000000000000004000000060000000000000000100000020002001000000000000000000000000000000000000",
    "difficulty": "0x0",
    "number": "0x2580bc7",
    "gasLimit": "0x1dcd6500",
    "gasUsed": "0x12c2bf",
    "timestamp": "0x6acd5336",
    "extraData": "0x",
    "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "nonce": "0x0000000000000000",
    "baseFeePerGas": "0x23c34600",
    "withdrawalsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "blobGasUsed": "0x0",
    "excessBlobGas": "0x0",
    "parentBeaconBlockRoot": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "requestsHash": "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "consensusContext": {
        "epoch": 1820,
        "view": 13857,
        "parentView": 13856,
        "proposer": "0xd0c08b9ba4f339d113bd7b59fccbf3c1de1e71d1622393b4a88548b9e3055149"
    },
    "size": "0x984",
    "timestampMillis": "0x1a1320d0ecf",
    "uncles": [],
    "withdrawals": []
} as unknown as rpc.GetBlock

const TRANSACTION = {
    "type": "0x76",
    "chainId": "0xa5bf",
    "feeToken": "0x20c0000000000000000000000000000000000000",
    "maxPriorityFeePerGas": "0x1",
    "maxFeePerGas": "0x55d4a801",
    "gas": "0xf4240",
    "calls": [
        {
            "to": "0x20c000000000000000000000a0849e4b4bdd90e2",
            "value": "0x0",
            "input": "0xa9059cbb000000000000000000000000c151aa22041e61ae4608edb96a7498f6160f71e10000000000000000000000000000000000000000000000000000000000000001",
            "data": null
        }
    ],
    "accessList": [],
    "nonceKey": "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "nonce": "0xffffffffffffffff",
    "feePayerSignature": null,
    "validBefore": "0x6acd5425",
    "validAfter": "0x5ef20953",
    "keyAuthorization": null,
    "aaAuthorizationList": [],
    "signature": {
        "type": "secp256k1",
        "r": "0xc0521eb95bfb357c07500ac2f992843a536e0babc2003fee8d27a854003fe03e",
        "s": "0x5ad72e85a25381043f2510a611ec92ae7ef1913942b6d7055424293763ae6c69",
        "yParity": "0x0",
        "v": "0x0"
    },
    "hash": "0xc2ca42a16b6828a7c483654b77002b0d11b40e79be468d38db756c1769c4e62f",
    "blockHash": "0xe8fee6471c528f65a929247da39b0658c97efaeb7dba592e584db59fab0caea8",
    "blockNumber": "0x2580bc7",
    "transactionIndex": "0x0",
    "from": "0xd09f8de3bf2c134429a683a2500a9f8fe01a2b46",
    "gasPrice": "0x23c34601",
    "blockTimestamp": "0x6acd5336"
} as unknown as rpc.Transaction


function blockWith(tx: Partial<rpc.Transaction>): rpc.Block {
    return {
        number: 39324103,
        hash: BLOCK_HEADER.hash,
        block: {...BLOCK_HEADER, transactions: [{...TRANSACTION, ...tx}]}
    }
}


function serialize(block: rpc.Block): string {
    return JSON.stringify(toJSON(mapRpcBlock(block)))
}


describe('Tempo uint64 nonce', () => {
    it('writes a nonce above 2^53 as an exact JSON number', () => {
        let json = serialize(blockWith({}))

        expect(json).toContain('"nonce":18446744073709551615,')
    })

    it('keeps a safe nonce a plain number', () => {
        let block = mapRpcBlock(blockWith({nonce: '0x9e89'}))

        expect(block.transactions[0].nonce).toBe(40585)
    })

    it('writes an AA authorization nonce above 2^53 as an exact JSON number', () => {
        // Synthetic: no such authorization is seen on chain yet, the field has the same u64 width.
        let authorization: rpc.TempoSignedAuthorization = {
            chainId: '0xa5bf',
            address: '0xd09f8de3bf2c134429a683a2500a9f8fe01a2b46',
            nonce: '0x7e8a30a12004e8fb',
            signature: TRANSACTION.signature!
        }

        let json = serialize(blockWith({aaAuthorizationList: [authorization]}))

        expect(json).toContain('"nonce":9118153864150051067,')
    })

    it('rejects a nonce above 2^64 - 1', () => {
        expect(() => mapRpcBlock(blockWith({nonce: '0x10000000000000000'}))).toThrow()
    })
})

import assert from 'assert'
import { describe, test } from 'vitest'
import * as ss58 from './index'


describe('registry.get()', () => {
    test('lookup by network and prefix are equivalent', () => {
        assert.strictEqual(ss58.registry.get('kusama'), ss58.registry.get(2))
    })

    test('kusama entry', () => {
        assert.deepEqual(ss58.registry.get('kusama'), {
            "prefix": 2,
            "network": "kusama",
            "displayName": "Kusama Relay Chain",
            "symbols": ["KSM"],
            "decimals": [12],
            "standardAccount": "*25519",
            "website": "https://kusama.network"
        })
    })

    test('throws on unknown network', () => {
        assert.throws(() => ss58.registry.get('fakefoo'))
    })

    test('throws on unknown prefix', () => {
        assert.throws(() => ss58.registry.get(500000))
    })
})


describe('registry.find()', () => {
    test('returns entry when present', () => {
        assert.strictEqual(ss58.registry.find('kusama'), ss58.registry.get('kusama'))
    })

    test('returns undefined when absent', () => {
        assert.strictEqual(ss58.registry.find('fakefoo'), undefined)
    })
})


describe('codec (ALICE)', () => {
    test('decode', () => {
        assert.deepEqual(
            ss58.codec(42).decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'),
            '0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
        )
    })

    test('encode', () => {
        assert.strictEqual(
            ss58.codec(42).encode('0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'),
            '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
        )
    })

    test('rejects prefix mismatch', () => {
        assert.throws(() => ss58.codec(2).decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'))
    })
})

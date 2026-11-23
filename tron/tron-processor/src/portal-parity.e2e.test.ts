import {HttpClient} from '@subsquid/http-client'
import {PortalClient} from '@subsquid/portal-client'
import * as base from '@subsquid/tron-data'
import type {RangeRequest} from '@subsquid/util-internal-range'
import {describe, expect, it} from 'vitest'
import type {DataRequest} from './data/data-request'
import {getFields} from './data/fields'
import type {FieldSelection} from './data/model'
import {HttpDataSource} from './http/source'
import type {Block} from './mapping/entities'
import {TronPortal, toPortalQuery} from './portal/source'

/**
 * Live parity tests: the same block range is fetched from the portal dataset (portal source)
 * and from a TRON HTTP API node (HTTP source), and the processor's blocks must be identical,
 * item for item.
 *
 * Network-gated: set `TRON_E2E=1`. Override endpoints with `TRON_HTTP_API` and `PORTAL_URL`
 * (portal base URL).
 *
 * Internal transactions are compared only with `TRON_E2E_INTERNAL_TX=1`: many public nodes
 * (including the default one) are not configured to record them and return none.
 */

const ENABLED = process.env.TRON_E2E === '1'
const PORTAL_URL = process.env.PORTAL_URL || 'https://portal.sqd.dev'
const HTTP_API = process.env.TRON_HTTP_API || 'https://tron-rpc.publicnode.com'
const INTERNAL_TX = process.env.TRON_E2E_INTERNAL_TX === '1'

const USDT = 'a614f803b6fd780986a42c78ec9c7f77e6ded13c'
const TRANSFER_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const ALL_FIELDS: FieldSelection = {
    block: {txTrieRoot: true, version: true, timestamp: true, witnessAddress: true, witnessSignature: true},
    transaction: {
        hash: true,
        ret: true,
        signature: true,
        type: true,
        parameter: true,
        permissionId: true,
        refBlockBytes: true,
        refBlockHash: true,
        feeLimit: true,
        expiration: true,
        timestamp: true,
        rawDataHex: true,
        fee: true,
        contractResult: true,
        contractAddress: true,
        resMessage: true,
        withdrawAmount: true,
        unfreezeAmount: true,
        withdrawExpireAmount: true,
        cancelUnfreezeV2Amount: true,
        result: true,
        energyFee: true,
        energyUsage: true,
        energyUsageTotal: true,
        netUsage: true,
        netFee: true,
        originEnergyUsage: true,
        energyPenaltyTotal: true,
    },
    log: {address: true, data: true, topics: true},
    internalTransaction: {
        hash: true,
        callerAddress: true,
        transferToAddress: true,
        callValueInfo: true,
        note: true,
        rejected: true,
        extra: true,
    },
}

function portalSource() {
    return new TronPortal({
        client: new PortalClient({
            url: `${PORTAL_URL}/datasets/tron-mainnet`,
            http: new HttpClient({retryAttempts: 50}),
        }),
        retryAttempts: 50,
    })
}

function httpSource() {
    let client = new base.TronHttpClient({baseUrl: HTTP_API, retryAttempts: 20})
    return new HttpDataSource(new base.HttpDataSource({httpApi: new base.HttpApi(client), strideConcurrency: 1}))
}

async function collect(src: {getFinalizedBlocks: TronPortal['getFinalizedBlocks']}, req: RangeRequest<DataRequest>) {
    let blocks: Block[] = []
    for await (let batch of src.getFinalizedBlocks([req], true)) {
        blocks.push(...batch.blocks)
    }
    return blocks
}

const RELATIONS = new Set(['block', 'transaction', 'logs', 'internalTransactions'])

function plain(item: object): Record<string, unknown> {
    let out: Record<string, unknown> = {}
    for (let [k, v] of Object.entries(item)) {
        if (RELATIONS.has(k)) continue
        out[k] = v
    }
    return JSON.parse(JSON.stringify(out, (_k, x) => (typeof x == 'bigint' ? x.toString() : x)))
}

function normalize(b: Block) {
    return {
        header: plain(b.header),
        transactions: b.transactions.map((tx) => ({
            ...plain(tx),
            logs: tx.logs.map((l) => l.id),
            internalTransactions: tx.internalTransactions.map((it) => it.id),
        })),
        logs: b.logs.map((l) => ({...plain(l), transaction: l.transaction?.id})),
        internalTransactions: b.internalTransactions.map((it) => ({...plain(it), transaction: it.transaction?.id})),
    }
}

function hasItems(b: Block) {
    return b.transactions.length + b.logs.length + b.internalTransactions.length > 0
}

/**
 * The HTTP source returns every block of the range, the portal only blocks with items
 * (plus range boundaries). Both must agree on every block they both return,
 * and the portal must return every block in which the HTTP source found items.
 */
async function assertParity(req: RangeRequest<DataRequest>) {
    let [p, h] = await Promise.all([collect(portalSource(), req), collect(httpSource(), req)])
    let httpByHeight = new Map(h.map((b) => [b.header.height, b]))
    let portalHeights = new Set(p.map((b) => b.header.height))

    for (let b of h) {
        if (hasItems(b)) expect(portalHeights.has(b.header.height), `block ${b.header.height}`).toBe(true)
    }
    for (let b of p) {
        let other = httpByHeight.get(b.header.height)
        expect(other, `block ${b.header.height}`).toBeDefined()
        expect(normalize(b)).toEqual(normalize(other!))
    }
    return {
        blocks: p.filter(hasItems).length,
        transactions: p.reduce((s, b) => s + b.transactions.length, 0),
        logs: p.reduce((s, b) => s + b.logs.length, 0),
        internalTransactions: p.reduce((s, b) => s + b.internalTransactions.length, 0),
    }
}

const RANGE = {from: 88_000_000, to: 88_000_009}

describe.skipIf(!ENABLED)('portal vs HTTP API parity', () => {
    it('USDT transfer logs with their transactions, all fields', {timeout: 600_000}, async () => {
        let res = await assertParity({
            range: RANGE,
            request: {
                fields: getFields(ALL_FIELDS),
                logs: [{where: {address: [USDT], topic0: [TRANSFER_TOPIC]}, include: {transaction: true}}],
            },
        })
        expect(res.logs).toBeGreaterThan(100)
    })

    it('transactions by type, transfers and contract calls, all fields', {timeout: 600_000}, async () => {
        let res = await assertParity({
            range: RANGE,
            request: {
                fields: getFields(ALL_FIELDS),
                transactions: [{where: {type: ['FreezeBalanceV2Contract', 'DelegateResourceContract']}}],
                transferTransactions: [{include: {logs: true}}],
                triggerSmartContractTransactions: [{where: {contract: ['41' + USDT]}, include: {logs: true}}],
            },
        })
        expect(res.transactions).toBeGreaterThan(100)
    })

    it.skipIf(!INTERNAL_TX)('internal transactions, all fields', {timeout: 600_000}, async () => {
        let res = await assertParity({
            range: RANGE,
            request: {
                fields: getFields(ALL_FIELDS),
                triggerSmartContractTransactions: [
                    {where: {contract: ['41' + USDT]}, include: {internalTransactions: true}},
                ],
                internalTransactions: [{include: {transaction: true}}],
            },
        })
        expect(res.internalTransactions).toBeGreaterThan(0)
    })
})

describe.skipIf(!ENABLED)('portal accepts every request the processor sends', () => {
    let cases: [string, DataRequest][] = [
        ['logs', {logs: [{where: {address: [USDT], topic0: [TRANSFER_TOPIC]}, include: {transaction: true}}]}],
        [
            'transactions',
            {transactions: [{where: {type: ['TransferContract']}, include: {logs: true, internalTransactions: true}}]},
        ],
        ['transferTransactions', {transferTransactions: [{where: {to: ['41' + USDT]}, include: {logs: true}}]}],
        [
            'transferAssetTransactions',
            {transferAssetTransactions: [{where: {asset: ['1002000']}, include: {internalTransactions: true}}]},
        ],
        [
            'triggerSmartContractTransactions',
            {triggerSmartContractTransactions: [{where: {contract: ['41' + USDT], sighash: ['a9059cbb']}}]},
        ],
        [
            'internalTransactions',
            {internalTransactions: [{where: {caller: ['41' + USDT]}, include: {transaction: true}}]},
        ],
        ['includeAllBlocks', {includeAllBlocks: true}],
    ]

    for (let [name, request] of cases) {
        it(name, {timeout: 600_000}, async () => {
            let client = new PortalClient({
                url: `${PORTAL_URL}/datasets/tron-mainnet`,
                http: new HttpClient({retryAttempts: 50}),
            })
            let query = toPortalQuery({range: RANGE, request: {fields: getFields({}), ...request}})
            let blocks = 0
            for await (let batch of client.getFinalizedStream(query)) {
                blocks += batch.blocks.length
            }
            // range boundaries are always returned
            expect(blocks).toBeGreaterThanOrEqual(2)
        })
    }
})

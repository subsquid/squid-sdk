import {ErrorMessage} from '@subsquid/util-internal-dump-cli'
import {describe, expect, it} from 'vitest'
import {createStreamMetrics, getStreamSettings} from './cli'
import {MISS_REASONS} from './message'

describe('stream settings', () => {
    it('are off when no option is set', () => {
        expect(getStreamSettings({})).toBeUndefined()
    })

    it('take a server together with a dataset', () => {
        let settings = getStreamSettings({
            streamUrl: 'nats://localhost:4222',
            streamDataset: 'solana-mainnet',
            streamWaitTimeout: 0,
        })

        expect(settings).toEqual({url: 'nats://localhost:4222', dataset: 'solana-mainnet', waitTimeout: 0})
    })

    it.each([{streamUrl: 'nats://localhost:4222'}, {streamDataset: 'solana-mainnet'}])(
        'reject a half set pair %o',
        (options) => {
            expect(() => getStreamSettings(options)).toThrow(ErrorMessage)
            expect(() => getStreamSettings(options)).toThrow('--stream-url and --stream-dataset must be set together')
        },
    )

    it('take a list of servers', () => {
        let streamUrl = 'nats://a:4222,nats://b:4222, nats://c:4222'
        let settings = getStreamSettings({streamUrl, streamDataset: 'solana-mainnet'})

        expect(settings?.url).toBe(streamUrl)
    })

    it('reject a list of servers that do not share credentials, without showing them', () => {
        let options = {streamUrl: 'nats://u:secret@a:4222,nats://u:other@b:4222', streamDataset: 'solana-mainnet'}

        expect(() => getStreamSettings(options)).toThrow(ErrorMessage)
        expect(() => getStreamSettings(options)).toThrow('invalid --stream-url: server 2 must have')
        expect(() => getStreamSettings(options)).not.toThrow(/secret|other/)
    })

    it('reject a dataset that is not a single subject token', () => {
        let options = {streamUrl: 'nats://localhost:4222', streamDataset: 'solana.mainnet'}
        expect(() => getStreamSettings(options)).toThrow("invalid --stream-dataset 'solana.mainnet'")
    })
})

describe('stream metrics', () => {
    it('show every series before its first event and count events by label', () => {
        let counts = new Map<string, number>()

        let metrics = createStreamMetrics({
            createCounter: (config) => ({
                inc(labels, value = 1) {
                    let key = `${config.name}${JSON.stringify(labels)}`
                    counts.set(key, (counts.get(key) ?? 0) + value)
                },
            }),
        })

        expect(counts.size).toBe(2 + MISS_REASONS.length)

        metrics.blocks('stream', 5)
        metrics.miss('crc')

        expect(counts.get('sqd_dump_blocks_total{"source":"stream"}')).toBe(5)
        expect(counts.get('sqd_dump_blocks_total{"source":"rpc"}')).toBe(0)
        expect(counts.get('sqd_dump_stream_miss_total{"reason":"crc"}')).toBe(1)
    })
})

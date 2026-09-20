import {ErrorMessage} from '@subsquid/util-internal-dump-cli'
import {afterEach, describe, expect, it} from 'vitest'
import zlib from 'node:zlib'
import {EvmDumper} from './dumper'
import {RawStreamSource} from './stream/source'

const argv = process.argv
const zstdDecompressSync = zlib.zstdDecompressSync

function makeDumper(...args: string[]): any {
    process.argv = ['node', 'evm-dump', '--endpoint', 'http://localhost:8545', ...args]
    return new EvmDumper()
}

function getRawStream(...args: string[]): unknown {
    return openStream(...args).stream
}

function openStream(...args: string[]): {stream: unknown; warnings: string[]} {
    let warnings: string[] = []
    let dumper = makeDumper(...args)

    dumper.log = () => ({
        warn: (message: string) => warnings.push(message),
        info: () => {},
        debug: () => {},
        child: () => ({debug: () => {}}),
    })

    return {stream: dumper.rawStream(), warnings}
}

describe('stream options', () => {
    afterEach(() => {
        process.argv = argv
        zlib.zstdDecompressSync = zstdDecompressSync
    })

    it('reads from RPC alone when there are none', () => {
        expect(getRawStream()).toBeUndefined()
    })

    it('takes a server together with a dataset', () => {
        let stream = getRawStream('--stream-url', 'nats://localhost:4222', '--stream-dataset', 'ethereum-mainnet')
        expect(stream).toBeInstanceOf(RawStreamSource)
    })

    it.each([0, 2500])('passes a publication wait timeout of %s ms to the source', (timeout) => {
        let stream = getRawStream(
            '--stream-url',
            'nats://localhost:4222',
            '--stream-dataset',
            'ethereum-mainnet',
            '--stream-wait-timeout',
            String(timeout),
        )

        expect(stream).toMatchObject({waitTimeout: timeout})
    })

    it('rejects a server without a dataset', () => {
        let open = () => getRawStream('--stream-url', 'nats://localhost:4222')

        expect(open).toThrow(ErrorMessage)
        expect(open).toThrow('--stream-url and --stream-dataset must be set together')
    })

    it('rejects a dataset without a server', () => {
        let open = () => getRawStream('--stream-dataset', 'ethereum-mainnet')

        expect(open).toThrow(ErrorMessage)
        expect(open).toThrow('--stream-url and --stream-dataset must be set together')
    })

    it('rejects a dataset that is not a single subject token', () => {
        for (let dataset of ['ethereum.mainnet', 'ethereum.*', '>', 'ethereum mainnet']) {
            let open = () => getRawStream('--stream-url', 'nats://localhost:4222', '--stream-dataset', dataset)

            expect(open).toThrow(ErrorMessage)
            expect(open).toThrow(`invalid --stream-dataset '${dataset}'`)
        }
    })

    it('is checked before the dump starts, not on the first block', () => {
        let dumper = makeDumper('--stream-url', 'nats://localhost:4222', '--stream-dataset', 'ethereum.mainnet')

        expect(() => dumper.validateOptions()).toThrow(ErrorMessage)
    })

    it('warns about the parts nothing ties to the verified header', () => {
        let {warnings} = openStream('--stream-url', 'nats://localhost:4222', '--stream-dataset', 'ethereum-mainnet')

        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('--verify-tx-root')
        expect(warnings[0]).toContain('--verify-logs-bloom')
    })

    it('says nothing when a root or a bloom covers every set', () => {
        let {warnings} = openStream(
            '--stream-url',
            'nats://localhost:4222',
            '--stream-dataset',
            'ethereum-mainnet',
            '--verify-tx-root',
            '--verify-logs-bloom',
        )

        expect(warnings).toEqual([])
    })

    it('names the Node.js version it needs', () => {
        zlib.zstdDecompressSync = undefined as any

        let open = () => getRawStream('--stream-url', 'nats://localhost:4222', '--stream-dataset', 'ethereum-mainnet')

        expect(open).toThrow(ErrorMessage)
        expect(open).toThrow('requires Node.js 22.15 or later')
    })
})

import {ErrorMessage} from '@subsquid/util-internal-dump-cli'
import {afterEach, describe, expect, it} from 'vitest'
import zlib from 'node:zlib'
import {EvmDumper} from './dumper'
import {RawStreamSource} from '@subsquid/util-internal-dump-stream'

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
        let {warnings} = openStream(
            '--stream-url',
            'nats://localhost:4222',
            '--stream-dataset',
            'ethereum-mainnet',
            '--verify-block-hash',
        )

        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('--verify-tx-root')
        expect(warnings[0]).toContain('--verify-receipts-root')
    })

    it('warns about logs that only a bloom covers', () => {
        let {warnings} = openStream(
            '--stream-url',
            'nats://localhost:4222',
            '--stream-dataset',
            'ethereum-mainnet',
            '--verify-block-hash',
            '--verify-tx-root',
            '--verify-logs-bloom',
        )

        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('logs (--with-receipts --verify-receipts-root)')
    })

    it('warns about a header it does not hash', () => {
        let {warnings} = openStream(
            '--stream-url',
            'nats://localhost:4222',
            '--stream-dataset',
            'ethereum-mainnet',
            '--with-receipts',
            '--verify-tx-root',
            '--verify-receipts-root',
        )

        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toContain('--verify-block-hash')
    })

    it('says nothing when a root covers every set', () => {
        let {warnings} = openStream(
            '--stream-url',
            'nats://localhost:4222',
            '--stream-dataset',
            'ethereum-mainnet',
            '--verify-block-hash',
            '--with-receipts',
            '--verify-tx-root',
            '--verify-receipts-root',
        )

        expect(warnings).toEqual([])
    })

    it('rejects --with-block-access-lists, that the stream does not check yet', () => {
        let open = () =>
            getRawStream(
                '--stream-url',
                'nats://localhost:4222',
                '--stream-dataset',
                'ethereum-mainnet',
                '--with-block-access-lists',
            )

        expect(open).toThrow(ErrorMessage)
        expect(open).toThrow('--stream-url does not support --with-block-access-lists yet')
    })

    it.each(['observe', 'reject'])(
        'takes --consensus-anchor-validation %s, that the stream verifier checks',
        (mode) => {
            let open = () =>
                getRawStream(
                    '--stream-url',
                    'nats://localhost:4222',
                    '--stream-dataset',
                    'ethereum-mainnet',
                    '--with-traces',
                    '--with-receipts',
                    '--verify-receipts-root',
                    '--verify-tx-root',
                    '--verify-tx-sender',
                    '--consensus-anchor-validation',
                    mode,
                )

            expect(open).not.toThrow()
        },
    )

    it('names the Node.js version it needs', () => {
        zlib.zstdDecompressSync = undefined as any

        let open = () => getRawStream('--stream-url', 'nats://localhost:4222', '--stream-dataset', 'ethereum-mainnet')

        expect(open).toThrow(ErrorMessage)
        expect(open).toThrow('requires Node.js 22.15 or later')
    })
})

describe('--derive-total-difficulty', () => {
    afterEach(() => {
        process.argv = argv
    })

    function block(number: number, difficulty: string, totalDifficulty?: string): any {
        return {number: '0x' + number.toString(16), difficulty, ...(totalDifficulty ? {totalDifficulty} : {})}
    }

    function setUp(args: string[], batches: any[][], archived?: any) {
        let dumper = makeDumper(...args)
        let warnings: any[] = []
        let archiveReads: number[] = []
        dumper.log = () => ({warn: (o: any) => warnings.push(o), info: () => {}, debug: () => {}})
        dumper.getSourceBlocks = async function* () {
            for (let b of batches) yield structuredClone(b)
        }
        dumper.getArchivedBlock = async (n: number) => {
            archiveReads.push(n)
            return archived
        }
        return {dumper, warnings, archiveReads}
    }

    async function collect(dumper: any, from: number): Promise<any[]> {
        let out: any[] = []
        for await (let bb of dumper.getBlocks({from})) out.push(...bb)
        return out
    }

    it("writes the parent's total difficulty plus the block's difficulty, from 0 at genesis", async () => {
        let {dumper} = setUp(['--derive-total-difficulty'], [[block(0, '0x1'), block(1, '0x2')], [block(2, '0x2')]])
        let out = await collect(dumper, 0)
        expect(out.map((b) => b.totalDifficulty)).toEqual(['0x1', '0x3', '0x5'])
    })

    it("starts from the archived parent's total difficulty and reads the archive once", async () => {
        let {dumper, archiveReads} = setUp(
            ['--derive-total-difficulty'],
            [[block(100, '0x2')]],
            block(99, '0x2', '0x10'),
        )
        expect((await collect(dumper, 100)).map((b) => b.totalDifficulty)).toEqual(['0x12'])

        dumper.getSourceBlocks = async function* () {
            yield [block(101, '0x0')]
        }
        expect((await collect(dumper, 101)).map((b) => b.totalDifficulty)).toEqual(['0x12'])
        expect(archiveReads).toEqual([99])
    })

    it('replaces a total difficulty the provider got wrong, and warns once', async () => {
        let {dumper, warnings} = setUp(
            ['--derive-total-difficulty'],
            [[block(1, '0x2', '0x100'), block(2, '0x2', '0x101')]],
            block(0, '0x1', '0x1'),
        )
        expect((await collect(dumper, 1)).map((b) => b.totalDifficulty)).toEqual(['0x3', '0x5'])
        expect(warnings).toHaveLength(1)
        expect(warnings[0]).toMatchObject({
            blockNumber: 1,
            providerTotalDifficulty: '0x100',
            derivedTotalDifficulty: '0x3',
        })
    })

    it('takes --parent-total-difficulty when the archive has no total difficulty for the parent', async () => {
        let {dumper} = setUp(
            ['--derive-total-difficulty', '--parent-total-difficulty', '0x20'],
            [[block(5, '0x2')]],
            block(4, '0x2'),
        )
        expect((await collect(dumper, 5)).map((b) => b.totalDifficulty)).toEqual(['0x22'])
    })

    it("stops when the parent's total difficulty is unknown", async () => {
        let {dumper} = setUp(['--derive-total-difficulty'], [[block(5, '0x2')]], block(4, '0x2'))
        await expect(collect(dumper, 5)).rejects.toThrow(ErrorMessage)
        await expect(collect(dumper, 5)).rejects.toThrow('the archived block has none')
    })

    it('refuses a block without a difficulty, and takes an explicit 0x0', async () => {
        let {dumper} = setUp(['--derive-total-difficulty'], [[block(0, '0x1'), {number: '0x1'}]])
        await expect(collect(dumper, 0)).rejects.toThrow('block 1 has no difficulty')

        let zero = setUp(['--derive-total-difficulty'], [[block(0, '0x1'), block(1, '0x0')]])
        expect((await collect(zero.dumper, 0)).map((b) => b.totalDifficulty)).toEqual(['0x1', '0x1'])
    })

    it('refuses a gap in the blocks', async () => {
        let {dumper} = setUp(['--derive-total-difficulty'], [[block(0, '0x1'), block(2, '0x1')]])
        await expect(collect(dumper, 0)).rejects.toThrow('got block 2 for 1')
    })

    it('leaves the blocks as they are without the option', async () => {
        let {dumper, archiveReads} = setUp([], [[block(1, '0x2', '0x100')]])
        expect((await collect(dumper, 1)).map((b) => b.totalDifficulty)).toEqual(['0x100'])
        expect(archiveReads).toEqual([])
    })
})

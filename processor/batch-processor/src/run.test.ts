import {AsyncQueue} from '@subsquid/util-internal'
import {FiniteRange, getSize} from '@subsquid/util-internal-range'
import assert, {AssertionError} from 'assert'
import expect from 'expect'
import {MockedObject, MockInstance, ModuleMocker} from 'jest-mock'
import {FinalTxInfo, HashAndHeight, HotDatabaseState, HotTxInfo} from './database'
import {DataSource} from './datasource'
import {FinalizedHeadBelowStateError} from './errors'
import {BlockBase, Processor} from './run'

const mock = new ModuleMocker(global)

class MockDataSource implements DataSource<BlockBase> {
    private queue: AsyncQueue<{finalizedHead: HashAndHeight; blocks: BlockBase[]}> | undefined

    async getBlockHash(): Promise<never> {
        throw new Error()
    }

    async getFinalizedHeight(): Promise<number> {
        return 0
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize([{from: 0}], range)
    }

    async *getBlockStream() {
        assert(this.queue == null)

        this.queue = new AsyncQueue(1)

        for await (let {finalizedHead, blocks} of this.queue.iterate()) {
            yield {
                finalizedHead,
                blocks,
            }
        }
    }

    async put(finalizedHead: HashAndHeight, blocks: BlockBase[]) {
        assert(this.queue != null)
        await this.queue.put({finalizedHead, blocks})
    }

    close() {
        this.queue?.close()
        this.queue = undefined
    }
}

class MockDataBase {
    supportsHotBlocks: boolean
    state: HotDatabaseState

    constructor(opts: {state?: HotDatabaseState; supportsHotBlocks?: boolean} = {}) {
        this.state = opts.state || {height: -1, hash: '0x', top: []}
        this.supportsHotBlocks = opts.supportsHotBlocks ?? true
    }

    async connect() {
        return this.state
    }

    async transact(info: FinalTxInfo) {
        this.state = {...info.nextHead, top: []}
    }

    async transactHot(info: HotTxInfo) {
        this.transactHot2(info)
    }

    async transactHot2(info: HotTxInfo) {
        assert(this.supportsHotBlocks)
        this.state = {...info.finalizedHead, top: []}
    }
}

function block(hash: string, height: number) {
    return {header: header(hash, height)}
}

function header(hash: string, height: number) {
    return {height, hash}
}

async function waitFor(cb: () => boolean, interval?: number) {
    await new Promise<void>((resolve) => {
        const intervalId = setInterval(() => {
            if (cb()) {
                clearInterval(intervalId)
                resolve()
            }
        }, interval ?? 10)
    })
}

async function waitForCallExact(fn: MockInstance<any>, times: number) {
    await waitFor(() => fn.mock.calls.length >= times)
    expect(fn).toHaveBeenCalledTimes(times)
}

async function waitForResultExact(fn: MockInstance<any>, times: number) {
    await waitFor(() => fn.mock.results.length >= times)
    expect(fn).toHaveReturnedTimes(times)
}

describe('processor', () => {
    let ds: MockedObject<MockDataSource>
    let db: MockedObject<MockDataBase>
    let p: MockedObject<Processor<BlockBase, unknown>>

    let batchHandler = async () => {}

    afterEach(() => {
        mock.resetAllMocks()
        ds?.close()
    })

    describe('common', () => {
        beforeEach(async () => {
            db = mock.mocked(new MockDataBase())
            ds = mock.mocked(new MockDataSource())
            p = mock.mocked(new Processor(ds, db, batchHandler))

            mock.spyOn(ds, 'getBlockStream')
            mock.spyOn(p, 'run')

            p.run().catch(() => {})

            await waitForCallExact(ds.getBlockStream, 1)

            mock.spyOn(db, 'transact')
        })

        it('throw on consistency error', async () => {
            await ds.put(header('0x1', 2), [block('0x0', 0), block('0x1', 1), block('0x2', 2)])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow(new Error())
        })

        it('throw on batch below state', async () => {
            await ds.put(header('0x1', 1), [block('0x0', 0), block('0x1', 1)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining(header('0x', -1)),
                    nextHead: expect.objectContaining(header('0x1', 1)),
                },
                expect.any(Function)
            )

            await ds.put(header('0x1', 1), [block('0x0', 0)])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow(new Error())
        })

        it('throw on finalized head below state', async () => {
            await ds.put(header('0x1', 1), [block('0x0', 0), block('0x1', 1)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining(header('0x', -1)),
                    nextHead: expect.objectContaining(header('0x1', 1)),
                },
                expect.any(Function)
            )

            await ds.put(header('0x0', 0), [block('0x2', 2)])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow(
                new FinalizedHeadBelowStateError(header('0x0', 0), header('0x1', 1))
            )
        })

        it('throw on finalized head not match state', async () => {
            await ds.put(header('0x1', 1), [block('0x0', 0), block('0x1', 1)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining(header('0x', -1)),
                    nextHead: expect.objectContaining(header('0x1', 1)),
                },
                expect.any(Function)
            )

            await ds.put(header('0x0', 1), [block('0x2', 2)])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow(new Error())
        })

        // it('throw on empty batch', async () => {
        //     await ds.put(header('0x0', 0), [])
        //
        //     await waitForResultExact(p.run, 1)
        //
        //     expect(p.run.mock.results[0].value).rejects.toThrow()
        // })
    })

    describe('without hot blocks support', () => {
        beforeEach(async () => {
            db = mock.mocked(new MockDataBase({supportsHotBlocks: false}))
            ds = mock.mocked(new MockDataSource())
            p = mock.mocked(new Processor(ds, db, batchHandler))

            mock.spyOn(ds, 'getBlockStream')
            mock.spyOn(p, 'run')

            p.run().catch(() => {})

            await waitForCallExact(ds.getBlockStream, 1)

            mock.spyOn(db, 'transact')
        })

        it('configure stream', async () => {
            expect(ds.getBlockStream).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    supportHotBlocks: false,
                })
            )
        })

        it('transact', async () => {
            await ds.put(header('0x2', 2), [block('0x0', 0), block('0x1', 1), block('0x2', 2)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining(header('0x', -1)),
                    nextHead: expect.objectContaining(header('0x2', 2)),
                },
                expect.any(Function)
            )
        })

        it('transact twice', async () => {
            await ds.put(header('0x1', 1), [block('0x0', 0), block('0x1', 1)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining({
                        hash: '0x',
                        height: -1,
                    }),
                    nextHead: expect.objectContaining({
                        hash: '0x1',
                        height: 1,
                    }),
                },
                expect.any(Function)
            )

            await ds.put(header('0x2', 2), [block('0x2', 2)])

            await waitForCallExact(db.transact, 2)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining({
                        hash: '0x1',
                        height: 1,
                    }),
                    nextHead: expect.objectContaining({
                        hash: '0x2',
                        height: 2,
                    }),
                },
                expect.any(Function)
            )
        })

        it('transact with finalized head above batch', async () => {
            await ds.put(header('0x3', 5), [block('0x0', 0), block('0x1', 1)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining({
                        hash: '0x',
                        height: -1,
                    }),
                    nextHead: expect.objectContaining({
                        hash: '0x1',
                        height: 1,
                    }),
                },
                expect.any(Function)
            )
        })

        it('throw on hot block', async () => {
            await ds.put(header('0x0', 0), [block('0x0', 0), block('0x1', 1)])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow(AssertionError)
        })
    })

    describe('with hot blocks support', () => {
        beforeEach(async () => {
            db = mock.mocked(new MockDataBase({supportsHotBlocks: true}))
            ds = mock.mocked(new MockDataSource())
            p = mock.mocked(new Processor(ds, db, batchHandler))

            mock.spyOn(ds, 'getBlockStream')
            mock.spyOn(p, 'run')

            p.run().catch(() => {})

            await waitForCallExact(ds.getBlockStream, 1)

            mock.spyOn(db, 'transact')
            mock.spyOn(db, 'transactHot2')
        })

        it('configure stream', async () => {
            expect(ds.getBlockStream).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    supportHotBlocks: true,
                })
            )
        })

        it('transact', async () => {
            await ds.put(header('0x2', 2), [block('0x0', 0), block('0x1', 1), block('0x2', 2)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining(header('0x', -1)),
                    nextHead: expect.objectContaining(header('0x2', 2)),
                },
                expect.any(Function)
            )
        })

        it('transact twice', async () => {
            await ds.put(header('0x1', 1), [block('0x0', 0), block('0x1', 1)])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining({
                        hash: '0x',
                        height: -1,
                    }),
                    nextHead: expect.objectContaining({
                        hash: '0x1',
                        height: 1,
                    }),
                },
                expect.any(Function)
            )

            await ds.put(header('0x2', 2), [block('0x2', 2)])

            await waitForCallExact(db.transact, 2)

            expect(db.transact).toHaveBeenLastCalledWith(
                {
                    prevHead: expect.objectContaining({
                        hash: '0x1',
                        height: 1,
                    }),
                    nextHead: expect.objectContaining({
                        hash: '0x2',
                        height: 2,
                    }),
                },
                expect.any(Function)
            )
        })

        it('transactHot', async () => {
            await ds.put(header('0x0', 0), [block('0x0', 0), block('0x1', 1), block('0x2', 2)])

            await waitForCallExact(db.transactHot2, 1)

            expect(db.transactHot2).toHaveBeenLastCalledWith(
                {
                    baseHead: expect.objectContaining({
                        ...header('0x', -1),
                        top: [],
                    }),
                    finalizedHead: expect.objectContaining(header('0x0', 0)),
                    newBlocks: [
                        expect.objectContaining(header('0x0', 0)),
                        expect.objectContaining(header('0x1', 1)),
                        expect.objectContaining(header('0x2', 2)),
                    ],
                },
                expect.any(Function)
            )
        })

        it('transactHot twice', async () => {
            await ds.put(header('0x0', 0), [block('0x0', 0), block('0x1', 1), block('0x2', 2)])

            await waitForCallExact(db.transactHot2, 1)

            expect(db.transactHot2).toHaveBeenLastCalledWith(
                {
                    baseHead: expect.objectContaining(header('0x', -1)),
                    finalizedHead: expect.objectContaining(header('0x0', 0)),
                    newBlocks: [
                        expect.objectContaining(header('0x0', 0)),
                        expect.objectContaining(header('0x1', 1)),
                        expect.objectContaining(header('0x2', 2)),
                    ],
                },
                expect.any(Function)
            )

            await ds.put(header('0x2', 2), [block('0x3', 3), block('0x4', 4), block('0x5', 5)])

            await waitForCallExact(db.transactHot2, 2)

            expect(db.transactHot2).toHaveBeenLastCalledWith(
                {
                    baseHead: expect.objectContaining(header('0x2', 2)),
                    finalizedHead: expect.objectContaining(header('0x2', 2)),
                    newBlocks: [
                        expect.objectContaining(header('0x3', 3)),
                        expect.objectContaining(header('0x4', 4)),
                        expect.objectContaining(header('0x5', 5)),
                    ],
                },
                expect.any(Function)
            )
        })

        it('transactHot twice with fork', async () => {
            await ds.put(header('0x0', 0), [block('0x0', 0), block('0x1', 1), block('0x2', 2), block('0x3', 3)])

            await waitForCallExact(db.transactHot2, 1)

            expect(db.transactHot2).toHaveBeenLastCalledWith(
                {
                    baseHead: expect.objectContaining(header('0x', -1)),
                    finalizedHead: expect.objectContaining(header('0x0', 0)),
                    newBlocks: [
                        expect.objectContaining(header('0x0', 0)),
                        expect.objectContaining(header('0x1', 1)),
                        expect.objectContaining(header('0x2', 2)),
                        expect.objectContaining(header('0x3', 3)),
                    ],
                },
                expect.any(Function)
            )

            await ds.put(header('0x1', 1), [block('0x2a', 2), block('0x3a', 3)])

            await waitForCallExact(db.transactHot2, 2)

            expect(db.transactHot2).toHaveBeenLastCalledWith(
                {
                    baseHead: expect.objectContaining(header('0x1', 1)),
                    finalizedHead: expect.objectContaining(header('0x1', 1)),
                    newBlocks: [expect.objectContaining(header('0x2a', 2)), expect.objectContaining(header('0x3a', 3))],
                },
                expect.any(Function)
            )
        })
    })
})

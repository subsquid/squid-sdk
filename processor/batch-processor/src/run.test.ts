import {AsyncQueue, createFuture, Future} from '@subsquid/util-internal'
import {FinalDatabase, FinalTxInfo, HashAndHeight, HotDatabase, HotDatabaseState, HotTxInfo} from './database'
import {BlockBase, Processor} from './run'
import assert from 'assert'
import {DataSource} from './datasource'
import {FiniteRange, getSize} from '@subsquid/util-internal-range'

class MockDataSource implements DataSource<BlockBase> {
    private queue = new AsyncQueue<{finalizedHead: HashAndHeight; blocks: BlockBase[]}>(1)
    private _supportsHotBlocks = true

    // private readyFuture = createFuture<void>()
    // private nextFuture: Future<void> | undefined

    private _isReady: boolean = false

    get isReady() {
        return this._isReady
    }

    async getBlockHash(): Promise<never> {
        throw new Error()
    }

    async getFinalizedHeight(): Promise<number> {
        return 0
    }

    getBlocksCountInRange(range: FiniteRange): number {
        return getSize([{from: 0}], range)
    }

    async *getBlockStream(opts: {supportHotBlocks?: boolean} = {}) {
        assert(!this.isReady)

        this._supportsHotBlocks = opts.supportHotBlocks ?? true

        this._isReady = true

        for await (let {finalizedHead, blocks} of this.queue.iterate()) {
            yield {
                finalizedHead,
                blocks: blocks.filter((b) => this._supportsHotBlocks || b.header.height <= finalizedHead.height),
            }
        }
    }

    async put(finalizedHead: HashAndHeight, blocks: BlockBase[]) {
        assert(this.isReady)
        await this.queue.put({finalizedHead, blocks})
    }

    close() {
        this.queue?.close()
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

function block(header: HashAndHeight) {
    return {header}
}

async function waitFor(cb: () => boolean, interval?: number) {
    await new Promise<void>((resolve) => {
        const intervalId = setInterval(() => {
            if (cb()) {
                clearInterval(intervalId)
                resolve()
            }
        }, interval ?? 5)
    })
}

async function waitForCallExact(fn: jest.Mock, times: number) {
    await waitFor(() => fn.mock.calls.length >= times)
    expect(fn).toHaveBeenCalledTimes(times)
}

async function waitForResultExact(fn: jest.Mock, times: number) {
    await waitFor(() => fn.mock.results.length >= times)
    expect(fn).toHaveReturnedTimes(times)
}

describe('processor', () => {
    let ds: jest.MockedObjectDeep<MockDataSource>
    let db: jest.MockedObjectDeep<MockDataBase>
    let p: jest.MockedObjectDeep<Processor<BlockBase, unknown>>

    let batchHandler = async () => {}

    afterEach(() => {
        jest.resetAllMocks()
        ds?.close()
    })

    describe('without hot blocks support', () => {
        beforeEach(async () => {
            db = jest.mocked(new MockDataBase({supportsHotBlocks: false}), {shallow: true})
            ds = jest.mocked(new MockDataSource(), {shallow: true})
            p = jest.mocked(new Processor(ds, db, batchHandler))

            jest.spyOn(ds, 'getBlockStream')
            jest.spyOn(db, 'transact')
            jest.spyOn(p, 'run')

            p.run().catch((error) => {
                error
            })

            await waitForCallExact(ds.getBlockStream, 1)
        })

        it('correctly configure stream', async () => {
            expect(ds.getBlockStream).toHaveBeenCalledWith(
                expect.objectContaining({
                    supportHotBlocks: false,
                })
            )
        })

        it('correctly transact', async () => {
            await ds.put({height: 2, hash: '0x2'}, [
                block({height: 0, hash: '0x0'}),
                block({height: 1, hash: '0x1'}),
                block({height: 2, hash: '0x2'}),
            ])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenCalledWith(
                {
                    prevHead: expect.objectContaining({
                        hash: '0x',
                        height: -1,
                    }),
                    nextHead: expect.objectContaining({
                        hash: '0x2',
                        height: 2,
                    }),
                },
                expect.any(Function)
            )
        })

        it('correctly transact 2', async () => {
            await ds.put({height: 1, hash: '0x1'}, [block({height: 0, hash: '0x0'}), block({height: 1, hash: '0x1'})])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenCalledWith(
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

            await ds.put({height: 2, hash: '0x2'}, [block({height: 2, hash: '0x2'})])

            await waitForCallExact(db.transact, 2)

            expect(db.transact).toHaveBeenCalledWith(
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

        it('throw on integrity error', async () => {
            await ds.put({height: 2, hash: '0x1'}, [
                block({height: 0, hash: '0x0'}),
                block({height: 1, hash: '0x1'}),
                block({height: 2, hash: '0x2'}),
            ])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow('block 2#2 should match finalized head 2#1')
        })

        it('throw on integrity error 2', async () => {
            await ds.put({height: 1, hash: '0x1'}, [block({height: 0, hash: '0x0'}), block({height: 1, hash: '0x1'})])

            await waitForCallExact(db.transact, 1)

            expect(db.transact).toHaveBeenCalledWith(
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

            await ds.put({height: 0, hash: '0x0'}, [block({height: 2, hash: '0x2'})])

            await waitForResultExact(p.run, 1)

            expect(p.run.mock.results[0].value).rejects.toThrow(
                'prev state 1#1 should be below or match finalized head 0#0'
            )
        })
    })

    // describe('with hot blocks support', () => {
    //     beforeEach(async () => {
    //         db = jest.mocked(new MockDataBase({supportsHotBlocks: true}))
    //         ds = jest.mocked(new MockDataSource())

    //         p = jest.mocked(new Processor(ds, db, async () => {}))
    //         void p.run()

    //         jest.spyOn(ds, 'getBlockStream')
    //         jest.spyOn(db, 'transact')

    //         await waitForCall(ds.getBlockStream)
    //     })

    //     it('correctly configures datasource stream', async () => {
    //         expect(ds.getBlockStream).toHaveBeenCalledWith(
    //             expect.objectContaining({
    //                 supportHotBlocks: true,
    //             })
    //         )
    //     })
    // })
})

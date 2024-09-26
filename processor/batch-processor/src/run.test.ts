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

    // promise() {
    //     return this.readyFuture.promise()
    // }

    // get isHotBlocksSupported() {
    //     assert(this.isReady)
    //     return this._supportsHotBlocks
    // }

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

        // this.readyFuture.resolve()
        this._isReady = true

        for await (let {finalizedHead, blocks} of this.queue.iterate()) {
            yield {
                finalizedHead,
                blocks: blocks.filter((b) => this._supportsHotBlocks || b.header.height <= finalizedHead.height),
            }

            // this.nextFuture?.resolve()
        }
    }

    // async put(finalizedHead: HashAndHeight, blocks: BlockBase[]) {
    //     assert(this.isReady)
    //     await this.queue.put({finalizedHead, blocks})

    //     // this.nextFuture = createFuture()
    //     // await this.nextFuture.promise()
    // }

    // close() {
    //     this.queue?.close()
    // }
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

describe('processor', () => {
    let ds: MockDataSource
    let db: MockDataBase
    let p: Processor<BlockBase, unknown>

    afterEach(() => {
        ds?.close()
    })

    describe('without hot blocks support', () => {
        beforeEach(async () => {
            db = new MockDataBase({supportsHotBlocks: false})
            ds = new MockDataSource()

            p = new Processor(ds, db, async () => {})
            void p.run()

            jest.spyOn(ds, 'getBlockStream').withImplementation(() => {
                
            })
            ds.getBlockStream = jest.fn()
            jest.spyOn(db, 'transact')

            jest.runAllTicks()
        })

        it('correctly configures datasource stream', async () => {
            expect(ds.getBlockStream).toHaveBeenCalledWith(
                expect.objectContaining({
                    supportHotBlocks: false,
                })
            )
        })

        it('aaaa', async () => {
            await ds.put({height: 1, hash: '0x1'}, [block({height: 0, hash: '0x0'}), block({height: 1, hash: '0x1'})])
            
            expect(db.transact).toHaveBeenCalledWith({height: 1, hash: '0x1', top: []})
        })
    })

    describe('with hot blocks support', () => {
        beforeEach(async () => {
            db = new MockDataBase({supportsHotBlocks: true})
            ds = new MockDataSource()

            p = new Processor(ds, db, async () => {})
            void p.run()

            jest.spyOn(ds, 'getBlockStream')
            jest.runAllTicks()
        })

        it('correctly configures datasource stream', async () => {
            expect(ds.getBlockStream).toHaveBeenCalledWith(
                expect.objectContaining({
                    supportHotBlocks: true,
                })
            )
        })
    })
})

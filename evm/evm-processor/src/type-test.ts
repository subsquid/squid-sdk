import {BatchHandlerContext, LogHandlerContext} from './interfaces/dataHandlers'
import {EvmBatchProcessor} from './processor'

const db: any = {}

function getItem<I>(cb: (item: I) => void) {
    return async function (ctx: BatchHandlerContext<any, I>) {}
}

new EvmBatchProcessor()
    .addLog('0xaa', {data: {evmLog: {topics: true}} as const})
    .addLog('0xaa', {data: {evmLog: {data: true}} as const})
    .run(
        db,
        getItem((item) => {
            if (item.kind == 'evmLog') {
                item.evmLog.topics
                item.evmLog.data
            }
        })
    )

new EvmBatchProcessor().addLog('0xaa').run(
    db,
    getItem((item) => {
        if (item.kind == 'evmLog') {
            item.evmLog.address
        }
    })
)

new EvmBatchProcessor()
    .addLog([], {data: {evmLog: {data: true}}} as const)
    .addLog([], {data: {evmLog: {topics: true}}} as const)
    .addLog('0xaa', {data: {evmLog: {data: true}, transaction: {hash: true}} as const})
    .run(
        db,
        getItem((item) => {
            if (item.kind === 'evmLog') {
                item.transaction.hash
                item.evmLog.data
                item.evmLog.topics
            }
        })
    )

new EvmBatchProcessor()
    .addLog([], {
        data: {
            evmLog: {
                data: true,
                topics: true,
            },
        } as const,
    })
    .addLog('0xaa', {
        data: {
            evmLog: {},
        } as const,
    })
    .addTransaction('0xaa', {
        sighash: ['a', 'b'],
        data: {
            transaction: {},
        } as const,
    })
    .addTransaction('0xaa', {
        sighash: 'a',
        data: {
            transaction: {},
        } as const,
    })
    .run(
        db,
        getItem((item) => {
            if (item.kind != 'evmLog') return

            type Log = LogHandlerContext<
                unknown,
                {
                    evmLog: {
                        data: true
                        topics: true
                    }
                }
            >['evmLog']

            type LogDefault = LogHandlerContext<
                unknown,
                {
                    evmLog: {}
                }
            >['evmLog']

            if (item.address === '0xaa') {
                const log: LogDefault = item.evmLog
            } else {
                const log1: Log = item.evmLog
                const log2: LogDefault = item.evmLog
            }
        })
    )

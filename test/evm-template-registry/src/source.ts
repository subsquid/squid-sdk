import type {Log as _Log} from '@subsquid/evm-objects'
import {DataSourceBuilder, type GetDataSourceBlock, type Block as DataSourceBlock} from '@subsquid/evm-stream'
import * as factory from './abi/uniswap-v2-factory'
import * as pair from './abi/uniswap-v2-pair'
import {FACTORY_SUSHI, FACTORY_UNI, TEMPLATE_SUSHI_PAIR, TEMPLATE_UNI_PAIR} from './constants'

export const dataSource = new DataSourceBuilder()
    .setPortal({
        url: 'https://portal.sqd.dev/datasets/arbitrum-one',
        http: {retryAttempts: 10},
    })
    .setBlockRange({from: 190000000})
    .setFields({
        block: {
            timestamp: true,
            size: true,
        },
        log: {
            transactionHash: true,
            address: true,
            topics: true,
            data: true,
        },
    })
    .addLog({
        where: {
            address: [FACTORY_SUSHI, FACTORY_UNI],
            topic0: [factory.events.PairCreated.topic],
        },
    })
    .addLog(TEMPLATE_SUSHI_PAIR, {
        where: {
            topic0: [pair.events.Swap.topic],
        },
    })
    .addLog(TEMPLATE_UNI_PAIR, {
        where: {
            topic0: [pair.events.Swap.topic],
        },
    })
    .build()

type Fields = GetDataSourceBlock<typeof dataSource> extends DataSourceBlock<infer F> ? F : never

export type Block = GetDataSourceBlock<typeof dataSource>
export type Log = _Log<Fields>

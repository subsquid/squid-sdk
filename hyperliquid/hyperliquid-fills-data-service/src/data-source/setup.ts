import {RpcClient} from '@subsquid/rpc-client'
import {createLogger} from '@subsquid/logger'
import {DataSource} from '@subsquid/util-internal-data-source'
import {Block} from '@subsquid/util-internal-data-service'
import {HyperliquidGateway} from './gateway'
import {Mapping} from './mapping'
import {HyperliquidGatewayDataSource} from './data-source'


const log = createLogger('sqd:hyperliquid-data-service/data-source')


export interface DataSourceOptions {
    gatewayProxy: string
    gatewayBlockQueueSize?: number
    gatewaySubscriptionTimeout?: number
    gatewayStalenessThreshold?: number
    gatewayStalenessTimeout?: number
}


export function createDataSource(options: DataSourceOptions): DataSource<Block> {
    let rpc = new RpcClient({
        url: options.gatewayProxy,
        requestTimeout: 10_000,
        retryAttempts: 5,
        log
    })
    let gateway = new HyperliquidGateway(rpc, {
        blockBufferSize: options.gatewayBlockQueueSize,
        subscriptionTimeout: options.gatewaySubscriptionTimeout,
        stalenessThreshold: options.gatewayStalenessThreshold,
        stalenessTimeout: options.gatewayStalenessTimeout
    })
    let dataSource = new HyperliquidGatewayDataSource(gateway)
    return new Mapping(dataSource)
}


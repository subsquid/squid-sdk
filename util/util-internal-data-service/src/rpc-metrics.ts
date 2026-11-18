// Moved to @subsquid/rpc-client so that other worker-based ingesters (e.g. the Solana dumper) can
// aggregate the metrics of their RPC clients too. Re-exported here for the data services.
export {RpcMetricsCollector, type RpcMetricsSource} from '@subsquid/rpc-client'

import {CallOptions, RpcClient, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcCall} from '@subsquid/rpc-client/lib/interfaces'
import {
    array,
    BYTES,
    DataValidationError,
    GetSrcType,
    NAT,
    nullable,
    object,
    Validator
} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {GetBlock, RawBlock, Receipt, StateDiff, Trace, TraceTransactionReplay} from './rpc-data'


export type Commitment = 'finalized' | 'latest'
export type RequestHelperField = "base" | "receipts" | "traces" | "stateDiffs"

export function getSuggestedChannelsByURL(rpc_url: string): [RequestHelperField, boolean][] {
    let url = new URL(rpc_url)
    let hostname = url.hostname;
    let [dataset, provider, ...other] = hostname.split(".")
    if (provider === "blastapi") {
        switch (dataset) {
            case "arbitrum-one":
                return [["traces", false], ["stateDiffs", false]];
            case "eth-mainnet":
                return [["traces", true], ["stateDiffs", true]];
        }
    }
    if (provider === "infura") {
        switch (dataset) {
            case "mainnet":
                return [["traces", true], ["stateDiffs", true]]
        }
    }
    if (provider === "dwellir") {
        switch (dataset) {
            case "api-eth-mainnet-archive":
                return [["traces", true], ["stateDiffs", true]]
        }        
    }
    return []
}

export class Rpc {
    constructor(
        private client: RpcClient,
        private priority: number = 0,
        private requests: {
            field: RequestHelperField,
            method: string,
            long_params: boolean,
            additional_params: any[],
            enabled: boolean 
        }[] = [
            {
                field: "base",
                method: "eth_getBlockByNumber",
                long_params: true,
                additional_params: [],
                enabled: true
            },
            {
                field: "receipts",
                method: "eth_getBlockReceipts",
                long_params: false,
                additional_params: [],
                enabled: true
            },
            {
                field: "traces",
                method: "trace_block",
                long_params: false,
                additional_params: [],
                enabled: false
            },
            {
                field: "stateDiffs",
                method: "trace_replayBlockTransactions",
                long_params: false,
                additional_params: [['stateDiff']],
                enabled: false
            }
        ]
    ) {
    }

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, priority)
    }

    setChannels(channels: [RequestHelperField, boolean][]) {
        for (let idx in channels) {
            let [field, enabled] = channels[idx];
            if (field == "base") {
                assert(enabled == true)
            }
            this.requests.filter(v => v.field == field).map(v => v.enabled = enabled);
        }
    }

    getConcurrency(): number {
        return this.client.getConcurrency()
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {priority: this.priority, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {priority: this.priority, ...options})
    }

    getLatestBlockhash(commitment: Commitment): Promise<LatestBlockhash> {
        return this.call('eth_getBlockByNumber', [commitment, false], {
            validateResult: getResultValidator(GetBlock)
        } ).then((block) => {
            return {
                number: parseInt(block.number, 16),
                hash: block.hash,
            };
        })
    }

    getBlock(number: number, options?: GetBlockOptions): Promise<GetBlock | null | undefined> {
        let requests = this.requests.filter((v) => v.enabled)
        let req_count = requests.length
        let promises = []
        let params = ["0x" + number.toString(16), options?.transactionDetails]
        let shortParams = ["0x" + number.toString(16)]
        for (let z = 0; z < req_count; z++) {
            let local_params: any[] = []
            local_params = local_params.concat(requests[z].long_params ? params : shortParams)
            local_params = local_params.concat(requests[z].additional_params)
            promises.push(this.call(requests[z].method, local_params))
        }

        return Promise.all(promises).then(results => {
            let holder: {
                base: RawBlock | undefined,
                receipts: Receipt[] | undefined,
                traces: Trace[] | undefined,
                stateDiffs: TraceTransactionReplay[] | undefined,
            } = {base: undefined, receipts: undefined, traces: undefined, stateDiffs: undefined}
            for (let z = 0; z < req_count; z++) {
                holder[requests[z].field] = results[z]
            }
            assert(holder["base"] !== undefined);
            let block = {
                ...holder["base"],
                receipts: holder["receipts"],
                traces: holder["traces"],
                stateDiffs: holder["stateDiffs"]
            };
            let validator = getResultValidator(nullable(GetBlock))
            return validator(block)
        })
    }

    getLightFinalizedBatch(numbers: number[]): Promise<(GetBlock | null | undefined)[]> {
        return this.getLatestBlockhash("finalized").then((blockhash) => {
            let filtered_promises = numbers
                .filter((v) => v <= blockhash.number)
                .map((number) => "0x" + number.toString(16))
                .map((hex_number) => this.call("eth_getBlockByNumber", [hex_number, false]))
            return Promise.all(filtered_promises);
        })
    }

    getBlockBatch(numbers: number[], options?: GetBlockOptions): Promise<(GetBlock | null | undefined)[]> {
        let requests = this.requests.filter((v) => v.enabled)
        let req_count = requests.length
        let call: RpcCall[] = new Array(numbers.length * req_count)
        for (let i = 0; i < numbers.length; i++) {
            let number = numbers[i]
            let params = ["0x" + number.toString(16), options?.transactionDetails]
            let shortParams = ["0x" + number.toString(16)]
            for (let z = 0; z < req_count; z++) {
                let local_params: any[] = []
                local_params = local_params.concat(requests[z].long_params ? params : shortParams)
                local_params = local_params.concat(requests[z].additional_params)
                call[req_count * i + z] = {method: requests[z].method, params: local_params}
            }
        }
        return this.reduceBatchOnRetry(call, {})
        .then(flat_result => {
            let res : GetBlock[] = [];
            for (let i = 0; i < flat_result.length / req_count; i++) {
                let holder: {
                    base: RawBlock | undefined,
                    receipts: Receipt[] | undefined,
                    traces: Trace[] | undefined,
                    stateDiffs: TraceTransactionReplay[] | undefined,
                } = {base: undefined, receipts: undefined, traces: undefined, stateDiffs: undefined}
                for (let z = 0; z < req_count; z++) {
                    holder[requests[z].field] = flat_result[req_count * i + z]
                }
                assert(holder["base"] !== undefined);
                res.push({
                    ...holder["base"],
                    receipts: holder["receipts"],
                    traces: holder["traces"],
                    stateDiffs: holder["stateDiffs"]
                });
            }
            let validator = getResultValidator(nullable(GetBlock))
            return res.map(validator)
        })
    }

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.client.isConnectionError(err) || err instanceof RpcProtocolError) return
            throw err
        })

        if (result) return result

        let pack = await Promise.all([
            this.reduceBatchOnRetry(batch.slice(0, Math.ceil(batch.length / 2)), options),
            this.reduceBatchOnRetry(batch.slice(Math.ceil(batch.length / 2)), options),
        ])

        return pack.flat()
    }
}


const LatestBlockhash = object({
    number: NAT,
    hash: BYTES
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


export interface GetBlockOptions {
    transactionDetails?: boolean
}


function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function(result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(`server returned unexpected result: ${err.toString()}`)
        } else {
            return result as any
        }
    }
}

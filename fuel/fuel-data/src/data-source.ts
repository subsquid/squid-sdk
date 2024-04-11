import {HttpClient} from '@subsquid/http-client'
import {Batch, coldIngest} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest} from '@subsquid/util-internal-range'
import {DataValidationError, GetSrcType, Validator} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {BlockData, Blocks, LatestBlockHeight, GetBlockHash, DataRequest} from './raw-data'


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


export interface HttpDataSourceOptions {
    client: HttpClient
    headPollInterval?: number
    strideSize?: number
    strideConcurrency?: number
}


export class HttpDataSource {
    private client: HttpClient
    private headPollInterval: number
    private strideSize: number
    private strideConcurrency: number

    constructor(options: HttpDataSourceOptions) {
        this.client = options.client
        this.headPollInterval = options.headPollInterval ?? 500
        this.strideSize = options.strideSize || 10
        this.strideConcurrency = options.strideConcurrency || 5
        assert(this.strideSize >= 1)
    }

    async getFinalizedHeight(): Promise<number> {
        let query = `
            {
                chain {
                    latestBlock {
                        header {
                            height
                        }
                    }
                }
            }
        `
        let response: LatestBlockHeight = await this.request(query, getResultValidator(LatestBlockHeight))
        let height = parseInt(response.chain.latestBlock.header.height)
        assert(Number.isSafeInteger(height))
        return height
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let query = `
            {
                block(height: "${height}") {
                    id
                }
            }
        `
        let response: GetBlockHash = await this.request(query, getResultValidator(GetBlockHash))
        return response.block?.id
    }

    getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<BlockData>> {
        return coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: async req => {
                let first = req.range.to - req.range.from
                let args = `first: ${first + 1}`
                if (req.range.from != 0) {
                    args += `, after: "${req.range.from - 1}"`
                }
                let query = `
                {
                    blocks(${args}) {
                        nodes {
                            header {
                                id
                                height
                                daHeight
                                transactionsRoot
                                transactionsCount
                                messageReceiptRoot
                                messageReceiptCount
                                prevRoot
                                time
                                applicationHash
                            }
                            transactions {
                                id
                                inputAssetIds
                                inputContracts {
                                    id
                                }
                                inputContract {
                                    utxoId
                                    balanceRoot
                                    stateRoot
                                    txPointer
                                    contract {
                                        id
                                    }
                                }
                                policies {
                                    gasPrice
                                    witnessLimit
                                    maturity
                                    maxFee
                                }
                                gasPrice
                                scriptGasLimit
                                maturity
                                mintAmount
                                mintAssetId
                                txPointer
                                isScript
                                isCreate
                                isMint
                                inputs {
                                    __typename
                                    ... on InputCoin {
                                        utxoId
                                        owner
                                        amount
                                        assetId
                                        txPointer
                                        witnessIndex
                                        maturity
                                        predicateGasUsed
                                        predicate
                                        predicateData
                                    }
                                    ... on InputContract {
                                        utxoId
                                        balanceRoot
                                        stateRoot
                                        txPointer
                                        contract {
                                            id
                                        }
                                    }
                                    ... on InputMessage {
                                        sender
                                        recipient
                                        amount
                                        nonce
                                        witnessIndex
                                        predicateGasUsed
                                        data
                                        predicate
                                        predicateData
                                    }
                                }
                                outputs {
                                    __typename
                                    ... on CoinOutput {
                                        to
                                        amount
                                        assetId
                                    }
                                    ... on ContractOutput {
                                        inputIndex
                                        balanceRoot
                                        stateRoot
                                    }
                                    ... on ChangeOutput {
                                        to
                                        amount
                                        assetId
                                    }
                                    ... on VariableOutput {
                                        to
                                        amount
                                        assetId
                                    }
                                    ... on ContractCreated {
                                        contract {
                                            id
                                            bytecode
                                            salt
                                        }
                                        stateRoot
                                    }
                                }
                                outputContract {
                                    inputIndex
                                    balanceRoot
                                    stateRoot
                                }
                                witnesses
                                receiptsRoot
                                status {
                                    __typename
                                    ... on SubmittedStatus {
                                        time
                                    }
                                    ... on SuccessStatus {
                                        transactionId
                                        time
                                        programState {
                                            returnType
                                            data
                                        }
                                    }
                                    ... on SqueezedOutStatus {
                                        reason
                                    }
                                    ... on FailureStatus {
                                        transactionId
                                        time
                                        reason
                                        programState {
                                            returnType
                                            data
                                        }
                                    }
                                }
                                receipts {
                                    contract {
                                        id
                                    }
                                    pc
                                    is
                                    to {
                                        id
                                    }
                                    toAddress
                                    amount
                                    assetId
                                    gas
                                    param1
                                    param2
                                    val
                                    ptr
                                    digest
                                    reason
                                    ra
                                    rb
                                    rc
                                    rd
                                    len
                                    receiptType
                                    result
                                    gasUsed
                                    data
                                    sender
                                    recipient
                                    nonce
                                    contractId
                                    subId
                                }
                                script
                                scriptData
                                bytecodeWitnessIndex
                                bytecodeLength
                                salt
                                storageSlots
                                rawPayload
                            }
                        }
                    }
                }
                `
                let response: Blocks = await this.request(query, getResultValidator(Blocks))
                let blocks = []
                for (let block of response.blocks.nodes) {
                    let height = parseInt(block.header.height)
                    assert(Number.isSafeInteger(height))
                    let blockData = {
                        hash: block.header.id,
                        height,
                        block,
                    }
                    blocks.push(blockData)
                }
                return blocks
            },
            requests,
            concurrency: this.strideConcurrency,
            splitSize: this.strideSize,
            stopOnHead,
            headPollInterval: this.headPollInterval
        })
    }

    private async request<T>(
        query: string,
        validateResult: (result: unknown) => T | undefined
    ): Promise<T> {
        return this.client.graphqlRequest(query, {retryAttempts: Number.MAX_SAFE_INTEGER})
            .then(res => validateResult ? validateResult(res) : res)
    }
}

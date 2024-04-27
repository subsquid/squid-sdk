import {Output} from '@subsquid/util-internal-code-printer'
import {DataRequest} from './raw-data';


export function getLatesBlockQuery() {
    return `
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
}


export function getBlockHashQuery(height: number) {
    return `
        {
            block(height: "${height}") {
                id
            }
        }
    `
}


export function getBlockHeaderQuery(height: number) {
    return `
        {
            block(height: "${height}") {
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
            }
        }
    `
}


export function getBlocksQuery(request: DataRequest, first: number, after?: number) {
    let args = `first: ${first}`
    if (after) {
        args += `, after: "${after}"`
    }
    let output = new Output()
    output.block('query', () => {
        output.block(`blocks(${args})`, () => {
            output.block('nodes', () => {
                output.block('header', () => {
                    output.line('id')
                    output.line('height')
                    output.line('daHeight')
                    output.line('transactionsRoot')
                    output.line('transactionsCount')
                    output.line('messageReceiptRoot')
                    output.line('messageReceiptCount')
                    output.line('prevRoot')
                    output.line('time')
                    output.line('applicationHash')
                })

                if (request.transactions) {
                    output.block('transactions', () => {
                        output.line('id')
                        output.line('inputAssetIds')
                        output.block('inputContracts', () => {
                            output.line('id')
                        })
                        output.block('inputContract', () => {
                            output.line('utxoId')
                            output.line('balanceRoot')
                            output.line('stateRoot')
                            output.line('txPointer')
                            output.block('contract', () => {
                                output.line('id')
                            })
                        })
                        output.block('policies', () => {
                            output.line('gasPrice')
                            output.line('witnessLimit')
                            output.line('maturity')
                            output.line('maxFee')
                        })
                        output.line('gasPrice')
                        output.line('scriptGasLimit')
                        output.line('maturity')
                        output.line('mintAmount')
                        output.line('mintAssetId')
                        output.line('txPointer')
                        output.line('isScript')
                        output.line('isCreate')
                        output.line('isMint')
                        output.block('outputContract', () => {
                            output.line('inputIndex')
                            output.line('balanceRoot')
                            output.line('stateRoot')
                        })
                        output.line('witnesses')
                        output.line('receiptsRoot')
                        output.block('status', () => {
                            output.line('__typename')
                            output.block('... on SubmittedStatus', () => {
                                output.line('time')
                            })
                            output.block('... on SuccessStatus', () => {
                                output.line('transactionId')
                                output.line('time')
                                output.block('programState', () => {
                                    output.line('returnType')
                                    output.line('data')
                                })
                            })
                            output.block('... on SqueezedOutStatus', () => {
                                output.line('reason')
                            })
                            output.block('... on FailureStatus', () => {
                                output.line('transactionId')
                                output.line('time')
                                output.line('reason')
                                output.block('programState', () => {
                                    output.line('returnType')
                                    output.line('data')
                                })
                            })
                        })
                        output.line('script')
                        output.line('scriptData')
                        output.line('bytecodeWitnessIndex')
                        output.line('bytecodeLength')
                        output.line('salt')
                        output.line('storageSlots')
                        output.line('rawPayload')

                        if (request.inputs) {
                            output.block('inputs', () => {
                                output.line('__typename')
                                output.block('... on InputCoin', () => {
                                    output.line('utxoId')
                                    output.line('owner')
                                    output.line('amount')
                                    output.line('assetId')
                                    output.line('txPointer')
                                    output.line('witnessIndex')
                                    output.line('maturity')
                                    output.line('predicateGasUsed')
                                    output.line('predicate')
                                    output.line('predicateData')
                                })
                                output.block('... on InputContract', () => {
                                    output.line('utxoId')
                                    output.line('balanceRoot')
                                    output.line('stateRoot')
                                    output.line('txPointer')
                                    output.block('contract', () => {
                                        output.line('id')
                                    })
                                })
                                output.block('... on InputMessage', () => {
                                    output.line('sender')
                                    output.line('recipient')
                                    output.line('amount')
                                    output.line('nonce')
                                    output.line('witnessIndex')
                                    output.line('predicateGasUsed')
                                    output.line('data')
                                    output.line('predicate')
                                    output.line('predicateData')
                                })
                            })
                        }

                        if (request.outputs) {
                            output.line('__typename')
                            output.block('... on CoinOutput', () => {
                                output.line('to')
                                output.line('amount')
                                output.line('assetId')
                            })
                            output.block('... on ContractOutput', () => {
                                output.line('inputIndex')
                                output.line('balanceRoot')
                                output.line('stateRoot')
                            })
                            output.block('... on ChangeOutput', () => {
                                output.line('to')
                                output.line('amount')
                                output.line('assetId')
                            })
                            output.block('... on VariableOutput', () => {
                                output.line('to')
                                output.line('amount')
                                output.line('assetId')
                            })
                            output.block('... on ContractCreated', () => {
                                output.block('contract', () => {
                                    output.line('id')
                                    output.line('bytecode')
                                    output.line('salt')
                                })
                                output.line('stateRoot')
                            })
                        }

                        if (request.receipts) {
                            output.block('receipts',() => {
                                output.block('contract', () => {
                                    output.line('id')
                                })
                                output.block('to', () => {
                                    output.line('id')
                                })
                                output.line('pc')
                                output.line('is')
                                output.line('toAddress')
                                output.line('amount')
                                output.line('assetId')
                                output.line('gas')
                                output.line('param1')
                                output.line('param2')
                                output.line('val')
                                output.line('ptr')
                                output.line('digest')
                                output.line('reason')
                                output.line('ra')
                                output.line('rb')
                                output.line('rc')
                                output.line('rd')
                                output.line('len')
                                output.line('receiptType')
                                output.line('result')
                                output.line('gasUsed')
                                output.line('data')
                                output.line('sender')
                                output.line('recipient')
                                output.line('nonce')
                                output.line('contractId')
                                output.line('subId')
                            })
                        }
                    })
                }

            })
        })
    })
    return output.toString()
}

import {Output} from '@subsquid/util-internal-code-printer'
import {DataRequest} from './raw-data';


export function getLatestBlockQuery() {
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
                    messageReceiptCount
                    prevRoot
                    time
                    applicationHash
                    eventInboxRoot
                    consensusParametersVersion
                    stateTransitionBytecodeVersion
                    messageOutboxRoot
                }
            }
        }
    `
}


function addReceipts(output: Output) {
    output.block('receipts', () => {
        output.line('id')
        output.line('pc')
        output.line('is')
        output.line('to')
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
                    output.line('messageReceiptCount')
                    output.line('prevRoot')
                    output.line('time')
                    output.line('applicationHash')
                    output.line('eventInboxRoot')
                    output.line('consensusParametersVersion')
                    output.line('stateTransitionBytecodeVersion')
                    output.line('messageOutboxRoot')
                })

                if (request.transactions) {
                    output.block('transactions', () => {
                        output.line('id')
                        output.line('inputAssetIds')
                        output.line('inputContracts')
                        output.block('inputContract', () => {
                            output.line('utxoId')
                            output.line('balanceRoot')
                            output.line('stateRoot')
                            output.line('txPointer')
                            output.line('contractId')
                        })
                        output.block('policies', () => {
                            output.line('tip')
                            output.line('witnessLimit')
                            output.line('maturity')
                            output.line('maxFee')
                        })
                        output.line('scriptGasLimit')
                        output.line('maturity')
                        output.line('mintAmount')
                        output.line('mintAssetId')
                        output.line('mintGasPrice')
                        output.line('txPointer')
                        output.line('isScript')
                        output.line('isCreate')
                        output.line('isMint')
                        output.line('isUpgrade')
                        output.line('isUpload')
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
                                output.line('totalGas')
                                output.line('totalFee')

                                if (request.receipts) {
                                    addReceipts(output)
                                }
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
                                output.line('totalGas')
                                output.line('totalFee')

                                if (request.receipts) {
                                    addReceipts(output)
                                }
                            })
                        })
                        output.line('script')
                        output.line('scriptData')
                        output.line('bytecodeRoot')
                        output.line('bytecodeWitnessIndex')
                        output.line('salt')
                        output.line('storageSlots')
                        output.line('rawPayload')
                        output.line('subsectionIndex')
                        output.line('subsectionsNumber')
                        output.line('proofSet')
                        output.block('upgradePurpose', () => {
                            output.line('__typename')
                            output.block('... on ConsensusParametersPurpose', () => {
                                output.line('witnessIndex')
                                output.line('checksum')
                            })
                            output.block('... on StateTransitionPurpose', () => {
                                output.line('root')
                            })
                        })

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
                                    output.line('predicateGasUsed')
                                    output.line('predicate')
                                    output.line('predicateData')
                                })
                                output.block('... on InputContract', () => {
                                    output.line('utxoId')
                                    output.line('balanceRoot')
                                    output.line('stateRoot')
                                    output.line('txPointer')
                                    output.line('contractId')
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
                            output.block('outputs', () => {
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
                                    output.line('contract')
                                    output.line('stateRoot')
                                })
                            })
                        }
                    })
                }
            })
        })
    })
    return output.toString()
}

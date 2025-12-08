import {weakMemo} from '@subsquid/util-internal'
import {
    ANY,
    array,
    ANY_INT,
    BOOLEAN,
    BYTES,
    constant,
    NAT,
    object,
    oneOf,
    option,
    STRING
} from '@subsquid/util-internal-validation'
import {project} from '../data/fields'
import {FieldSelection} from '../data/model'


export const getDataSchema = weakMemo((fields: FieldSelection) => {
    let BlockHeader = object({
        height: NAT,
        hash: BYTES,
        parentHash: BYTES,
        ...project(fields.block, {
            nonce: BYTES,
            sha3Uncles: BYTES,
            logsBloom: BYTES,
            transactionsRoot: BYTES,
            stateRoot: BYTES,
            receiptsRoot: BYTES,
            mixHash: BYTES,
            miner: BYTES,
            difficulty: ANY_INT,
            totalDifficulty: ANY_INT,
            extraData: BYTES,
            size: ANY_INT,
            gasLimit: ANY_INT,
            gasUsed: ANY_INT,
            timestamp: NAT,
            baseFeePerGas: ANY_INT,
            l1BlockNumber: NAT
        })
    })

    let Transaction = object({
        transactionIndex: NAT,
        ...project(fields.transaction, {
            hash: BYTES,
            from: BYTES,
            to: option(BYTES),
            gas: ANY_INT,
            gasPrice: ANY_INT,
            maxFeePerGas: option(ANY_INT),
            maxPriorityFeePerGas: option(ANY_INT),
            input: BYTES,
            nonce: NAT,
            value: ANY_INT,
            v: ANY_INT,
            r: BYTES,
            s: BYTES,
            yParity: option(NAT),
            chainId: option(NAT),
            gasUsed: ANY_INT,
            cumulativeGasUsed: ANY_INT,
            effectiveGasPrice: ANY_INT,
            contractAddress: option(BYTES),
            type: NAT,
            status: NAT,
            sighash: BYTES,
            l1Fee: option(ANY_INT),
            l1FeeScalar: option(NAT),
            l1GasPrice: option(ANY_INT),
            l1GasUsed: option(ANY_INT),
            l1BlobBaseFee: option(ANY_INT),
            l1BlobBaseFeeScalar: option(NAT),
            l1BaseFeeScalar: option(NAT)
        })
    })

    let Log = object({
        logIndex: NAT,
        transactionIndex: NAT,
        ...project(fields.log, {
            transactionHash: BYTES,
            address: BYTES,
            data: BYTES,
            topics: array(BYTES)
        })
    })

    let Trace = object({
        transactionIndex: NAT,
        traceAddress: array(NAT),
        ...project(fields.trace, {
            type: STRING,
            subtraces: NAT,
            error: option(STRING),
            revertReason: option(STRING),
            // Create fields
            createFrom: option(BYTES),
            createValue: option(ANY_INT),
            createGas: option(ANY_INT),
            createInit: option(BYTES),
            createResultGasUsed: option(ANY_INT),
            createResultCode: option(BYTES),
            createResultAddress: option(BYTES),
            // Call fields
            callType: option(STRING),
            callFrom: option(BYTES),
            callTo: option(BYTES),
            callValue: option(ANY_INT),
            callGas: option(ANY_INT),
            callInput: option(BYTES),
            callSighash: option(BYTES),
            callResultGasUsed: option(ANY_INT),
            callResultOutput: option(BYTES),
            // Suicide fields
            suicideAddress: option(BYTES),
            suicideRefundAddress: option(BYTES),
            suicideBalance: option(ANY_INT),
            // Reward fields
            rewardAuthor: option(BYTES),
            rewardValue: option(ANY_INT),
            rewardType: option(STRING)
        })
    })

    let StateDiff = object({
        transactionIndex: NAT,
        address: BYTES,
        key: oneOf({
            balance: constant('balance'),
            code: constant('code'),
            nonce: constant('nonce'),
            storageKey: BYTES
        }),
        ...project(fields.stateDiff, {
            kind: oneOf({
                noChange: constant('='),
                add: constant('+'),
                change: constant('*'),
                delete: constant('-')
            }),
            prev: option(BYTES),
            next: option(BYTES)
        })
    })

    return object({
        header: BlockHeader,
        transactions: array(Transaction),
        logs: array(Log),
        traces: array(Trace),
        stateDiffs: array(StateDiff)
    })
})

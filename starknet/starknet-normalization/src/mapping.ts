import type * as rpc from '@subsquid/starknet-data'
import {Block, BlockHeader, Transaction, Event, TransactionType, PriceUnit} from './data'
import {addErrorContext} from '@subsquid/util-internal'

export function mapRpcBlock(src: rpc.Block): Block {
    let header: BlockHeader = {
        hash: src.block_hash,
        height: src.block_number,
        parentHash: src.parent_hash,
        status: src.status,
        newRoot: src.new_root,
        timestamp: src.timestamp,
        sequencerAddress: src.sequencer_address
    }

    let events: Event[] = []

    let transactions = src.transactions
        ?.map((tx, i) => {
            try {
                return mapRpcTransaction(i, tx, events)
            } catch(err: any) {
                throw addErrorContext(err, {
                    blockTransaction: tx.transaction.transaction_hash
                })
            }
        }) ?? []

    return {
        header,
        transactions,
        events
    }
}


function mapRpcTransaction(
    transactionIndex: number,
    src: rpc.PackedTransaction,
    events: Event[]
): Transaction {
    const tx = src.transaction;
    const receipt = src.receipt;
    
    // Create transaction object with all possible fields
    const transaction: Transaction = {
        transactionIndex,
        transactionHash: tx.transaction_hash,
        contractAddress: tx.contract_address ?? undefined,
        entryPointSelector: tx.entry_point_selector ?? undefined,
        calldata: tx.calldata ?? undefined,
        maxFee: tx.max_fee ?? undefined,
        type: tx.type as TransactionType,
        senderAddress: tx.sender_address ?? undefined,
        version: tx.version,
        signature: tx.signature ?? undefined,
        nonce: tx.nonce != null ? BigInt(tx.nonce) : undefined,
        classHash: tx.class_hash ?? undefined,
        compiledClassHash: tx.compiled_class_hash ?? undefined,
        contractAddressSalt: tx.contract_address_salt ?? undefined,
        constructorCalldata: tx.constructor_calldata ?? undefined,
        resourceBounds: tx.resource_bounds ? {
            l1GasMaxAmount: BigInt(tx.resource_bounds.l1_gas.max_amount),
            l1GasMaxPricePerUnit: BigInt(tx.resource_bounds.l1_gas.max_price_per_unit),
            l1DataGasMaxAmount: BigInt(tx.resource_bounds.l1_data_gas.max_amount),
            l1DataGasMaxPricePerUnit: BigInt(tx.resource_bounds.l1_data_gas.max_price_per_unit),
            l2GasMaxAmount: BigInt(tx.resource_bounds.l2_gas.max_amount),
            l2GasMaxPricePerUnit: BigInt(tx.resource_bounds.l2_gas.max_price_per_unit)
        } : undefined,
        tip: tx.tip ?? undefined,
        paymasterData: tx.paymaster_data ?? undefined,
        accountDeploymentData: tx.account_deployment_data ?? undefined,
        nonceDataAvailabilityMode: tx.nonce_data_availability_mode ?? undefined,
        feeDataAvailabilityMode: tx.fee_data_availability_mode ?? undefined,
        messageHash: receipt.message_hash ?? undefined,
        actualFee: {
            amount: receipt.actual_fee.amount,
            unit: receipt.actual_fee.unit as PriceUnit
        },
        finalityStatus: receipt.finality_status
    };

    // Process events from the receipt
    receipt.events?.forEach((event, eventIndex) => {
        events.push({
            transactionIndex,
            eventIndex,
            fromAddress: event.from_address,
            keys: event.keys,
            data: event.data
        });
    });

    return transaction;
}
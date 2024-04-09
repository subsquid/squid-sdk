import assert from 'assert'
import {EventType, sts} from './support'

/**
 * A custom event emitted by the contract.
 */
export const ContractsContractEmittedV31 = new EventType(
    sts.struct({
        /**
         * The contract that emitted the event.
         */
        contract: sts.bytes(),
        /**
         * Data supplied by the contract. Metadata generated during contract compilation
         * is needed to decode it.
         */
        data: sts.bytes(),
    })
)

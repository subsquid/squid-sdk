import {sts} from '../../pallet.support'
import {H256} from './types'

/**
 * Clear a previously made request for a preimage.
 * 
 * NOTE: THIS MUST NOT BE CALLED ON `hash` MORE TIMES THAN `request_preimage`.
 */
export type PreimageUnrequestPreimageCall = {
    hash: H256,
}

export const PreimageUnrequestPreimageCall: sts.Type<PreimageUnrequestPreimageCall> = sts.struct(() => {
    return  {
        hash: H256,
    }
})

/**
 * Clear an unrequested preimage from the runtime storage.
 */
export type PreimageUnnotePreimageCall = {
    hash: H256,
}

export const PreimageUnnotePreimageCall: sts.Type<PreimageUnnotePreimageCall> = sts.struct(() => {
    return  {
        hash: H256,
    }
})

/**
 * Request a preimage be uploaded to the chain without paying any fees or deposits.
 * 
 * If the preimage requests has already been provided on-chain, we unreserve any deposit
 * a user may have paid, and take the control of the preimage out of their hands.
 */
export type PreimageRequestPreimageCall = {
    hash: H256,
}

export const PreimageRequestPreimageCall: sts.Type<PreimageRequestPreimageCall> = sts.struct(() => {
    return  {
        hash: H256,
    }
})

/**
 * Register a preimage on-chain.
 * 
 * If the preimage was previously requested, no fees or deposits are taken for providing
 * the preimage. Otherwise, a deposit is taken proportional to the size of the preimage.
 */
export type PreimageNotePreimageCall = {
    bytes: Bytes,
}

export const PreimageNotePreimageCall: sts.Type<PreimageNotePreimageCall> = sts.struct(() => {
    return  {
        bytes: sts.bytes(),
    }
})

/**
 * A preimage has been requested.
 */
export type PreimageRequestedEvent = {
    hash: H256,
}

export const PreimageRequestedEvent: sts.Type<PreimageRequestedEvent> = sts.struct(() => {
    return  {
        hash: H256,
    }
})

/**
 * A preimage has been noted.
 */
export type PreimageNotedEvent = {
    hash: H256,
}

export const PreimageNotedEvent: sts.Type<PreimageNotedEvent> = sts.struct(() => {
    return  {
        hash: H256,
    }
})

/**
 * A preimage has ben cleared.
 */
export type PreimageClearedEvent = {
    hash: H256,
}

export const PreimageClearedEvent: sts.Type<PreimageClearedEvent> = sts.struct(() => {
    return  {
        hash: H256,
    }
})

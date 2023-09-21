import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9230 from './types/v9230'
import * as v9111 from './types/v9111'
import * as v2007 from './types/v2007'
import * as v2005 from './types/v2005'
import * as v1024 from './types/v1024'
import * as v1020 from './types/v1020'

export const events = {
    Claimed: createEvent(
        'Claims.Claimed',
        {
            v1020: v1020.ClaimsClaimedEvent,
            v9230: v9230.ClaimsClaimedEvent,
        }
    ),
}

export const calls = {
    attest: createCall(
        'Claims.attest',
        {
            v2005: v2005.ClaimsAttestCall,
        }
    ),
    claim: createCall(
        'Claims.claim',
        {
            v1020: v1020.ClaimsClaimCall,
            v9111: v9111.ClaimsClaimCall,
        }
    ),
    claim_attest: createCall(
        'Claims.claim_attest',
        {
            v2005: v2005.ClaimsClaimAttestCall,
            v9111: v9111.ClaimsClaimAttestCall,
        }
    ),
    mint_claim: createCall(
        'Claims.mint_claim',
        {
            v1020: v1020.ClaimsMintClaimCall,
            v1024: v1024.ClaimsMintClaimCall,
            v2005: v2005.ClaimsMintClaimCall,
            v9111: v9111.ClaimsMintClaimCall,
        }
    ),
    move_claim: createCall(
        'Claims.move_claim',
        {
            v2007: v2007.ClaimsMoveClaimCall,
            v9111: v9111.ClaimsMoveClaimCall,
        }
    ),
}

export const constants = {
    Prefix: createConstant(
        'Claims.Prefix',
        {
            v1020: v1020.ClaimsPrefixConstant,
        }
    ),
}

export const storage = {
    Claims: createStorage(
        'Claims.Claims',
        {
            v1020: v1020.ClaimsClaimsStorage,
        }
    ),
    Preclaims: createStorage(
        'Claims.Preclaims',
        {
            v2005: v2005.ClaimsPreclaimsStorage,
        }
    ),
    Signing: createStorage(
        'Claims.Signing',
        {
            v2005: v2005.ClaimsSigningStorage,
        }
    ),
    Total: createStorage(
        'Claims.Total',
        {
            v1020: v1020.ClaimsTotalStorage,
        }
    ),
    Vesting: createStorage(
        'Claims.Vesting',
        {
            v1024: v1024.ClaimsVestingStorage,
        }
    ),
}

export default {events, calls, constants}

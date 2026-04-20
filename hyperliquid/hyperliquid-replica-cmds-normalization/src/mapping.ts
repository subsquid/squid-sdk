import * as raw from '@subsquid/hyperliquid-replica-cmds-data'
import assert from 'assert'
import {Action, Block, BlockHeader} from './data'


function mapRawAction(raw: raw.SignedAction, response: raw.Response, actionIndex: number): Action {
    return {
        actionIndex,
        signature: raw.signature,
        action: raw.action,
        nonce: raw.nonce,
        vaultAddress: raw.vaultAddress ?? undefined,
        user: response.user ?? undefined,
        status: response.res.status,
        response: response.res.response,
    }
}


export function mapRawBlock(raw: raw.Block): Block {
    let header: BlockHeader = {
        height: raw.height,
        // it's unknown how to calculate block hash yet
        // but hash field is required among the indexing stack
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        round: raw.block.abci_block.round,
        parentRound: raw.block.abci_block.parent_round,
        proposer: raw.block.abci_block.proposer,
        timestamp: toTimestamp(raw.block.abci_block.time),
        hardfork: raw.block.abci_block.hardfork,
    }

    let actions: Action[] = []
    let bundles = raw.block.abci_block.signed_action_bundles
    assert(bundles.length == raw.block.resps.Full.length)
    for (let i = 0; i < bundles.length; i++) {
        let [bundle_hash, signed_actions] = bundles[i]
        let [bundle_responses_hash, responses] = raw.block.resps.Full[i]
        assert(bundle_hash == bundle_responses_hash)
        assert(signed_actions.signed_actions.length == responses.length)

        for (let j = 0; j < signed_actions.signed_actions.length; j++) {
            let signed_action = signed_actions.signed_actions[j]
            let response = responses[j]
            let action = mapRawAction(signed_action, response, actions.length)
            actions.push(action)
        }
    }

    return {
        header,
        actions
    }
}


function toTimestamp(time: string) {
    let ts = Date.parse(time)
    assert(Number.isSafeInteger(ts))
    return ts
}

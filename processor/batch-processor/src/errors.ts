import {HashAndHeight} from './database'
import {formatHead} from './util'

export class DatabaseNotSupportHotBlocksError extends Error {
    constructor() {
        super('database does not support hot blocks')
    }
}

export class AlreadyIndexedBlockNotFoundError extends Error {
    constructor(block: HashAndHeight) {
        super(`already indexed block ${formatHead(block)} was not found on chain`)
    }
}

export class FinalizedHeadBelowStateError extends Error {
    constructor(finalizedHead: HashAndHeight, state: HashAndHeight) {
        super(`finalized head ${formatHead(finalizedHead)} can not be below state ${formatHead(state)}`)
    }
}

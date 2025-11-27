import {last} from '@subsquid/util-internal'
import type {BlockRef} from './types'


export class ForkException extends Error {
    constructor(
        fromBlock: number,
        parentBlockHash: string,
        public previousBlocks: BlockRef[]
    ) {
        let base = last(previousBlocks)
        super(
            `expected block ${fromBlock} to have parent hash ${parentBlockHash}, ` +
            `but got ${base.number}#${base.hash} as a parent instead`
        )
    }

    get name(): string {
        return 'ForkException'
    }

    get isSubsquidPortalForkException(): true {
        return true
    }
}


export function isForkException(err: unknown): err is ForkException {
    return err instanceof Error && (err as any).isSubsquidPortalForkException === true
}

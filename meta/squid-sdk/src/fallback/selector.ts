import {SourceHealth} from './health'

/**
 * Picks the active source from the ranked list using the trinary health asymmetrically (§4):
 *  - **failover / cold start** tries the lowest-index `healthy` *or* `unknown` source —
 *    `unknown` optimistically, because the stream itself is the fastest health test;
 *  - **switch-up** only ever promotes to a capability-confirmed `healthy` source of *higher*
 *    preference (lower index) than the active one — never to an unproven `unknown`.
 */
export class Selector {
    constructor(private health: SourceHealth[]) {}

    pickForFailover(): number | undefined {
        for (let i = 0; i < this.health.length; i++) {
            let s = this.health[i].state
            if (s === 'healthy' || s === 'unknown') return i
        }

        return undefined
    }

    pickSwitchUp(active: number): number | undefined {
        for (let i = 0; i < active; i++) {
            if (this.health[i].state === 'healthy') return i
        }

        return undefined
    }
}

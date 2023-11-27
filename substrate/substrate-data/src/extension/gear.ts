import {Runtime} from '@subsquid/substrate-runtime'
import {bytes, struct} from '@subsquid/substrate-runtime/lib/sts'
import {Event} from '../interfaces/data'
import {assertEvent} from '../types/util'


const GearMessageQueued = struct({
    destination: bytes()
})


const GearUserMessageSent = struct({
    message: struct({
        source: bytes()
    })
})


export function setGearProgramId(runtime: Runtime, event: Event): void {
    switch(event.name) {
        case 'Gear.MessageQueued':
            assertEvent(runtime, GearMessageQueued, event)
            event._gearProgramId = event.args.destination
            break
        case 'Gear.UserMessageSent':
            assertEvent(runtime, GearUserMessageSent, event)
            event._gearProgramId = event.args.message.source
            break
    }
}

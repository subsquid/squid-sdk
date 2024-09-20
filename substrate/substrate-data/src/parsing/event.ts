import {Bytes, Runtime} from '@subsquid/substrate-runtime'
import {array, closedEnum, externalEnum, GetType, number, struct, unknown, bytes} from '@subsquid/substrate-runtime/lib/sts'
import {Event} from '../interfaces/data'
import {assertStorage} from '../types/util'


const EventItem = struct({
    phase: closedEnum({
        Initialization: unknown(),
        ApplyExtrinsic: number(),
        Finalization: unknown()
    }),
    event: externalEnum(),
    topics: array(bytes())
})


const EventItemList = array(EventItem)


export function decodeEvents(runtime: Runtime, eventsStorageValue: Bytes | undefined | null): Event[] {
    assertStorage(runtime, 'System.Events', ['Required', 'Default'], [], EventItemList)

    let items: GetType<typeof EventItem>[] = runtime.decodeStorageValue(
        'System.Events',
        eventsStorageValue
    )

    return items.map((it, index) => {
        let {name, args} = runtime.toEventRecord(it.event)
        let e: Event = {
            index,
            name,
            args,
            topics: it.topics,
            phase: it.phase.__kind
        }
        if (it.phase.__kind == 'ApplyExtrinsic') {
            e.extrinsicIndex = it.phase.value
        }
        return e
    })
}

import {toCamelCase} from "@subsquid/util"
import assert from "assert"
import {ChainDescription} from "./chainDescription"
import {QualifiedName, TypeKind, Variant} from "./types"
import {getTypeHash} from "./types-hashing"
import {sha256} from "./util"


export interface EventDefinition extends Variant {
    pallet: string
}


const EVENTS_CACHE = new WeakMap<ChainDescription, Record<QualifiedName, EventDefinition>>()


export function getEvents(d: ChainDescription): Record<QualifiedName, EventDefinition> {
    let events = EVENTS_CACHE.get(d)
    if (events == null) {
        events = describeEvents(d)
        EVENTS_CACHE.set(d, events)
    }
    return events
}


function describeEvents(d: ChainDescription): Record<QualifiedName, EventDefinition> {
    let events: Record<string, EventDefinition> = {}
    let pallets = d.types[d.event]
    assert(pallets.kind == TypeKind.Variant)
    pallets.variants.forEach(palletVariant => {
        let section = toCamelCase(palletVariant.name)
        assert(palletVariant.fields.length == 1)
        let palletEvents = d.types[palletVariant.fields[0].type]
        assert(palletEvents.kind == TypeKind.Variant)
        palletEvents.variants.forEach(eventVariant => {
            let qualifiedName = `${section}.${eventVariant.name}`
            events[qualifiedName] = {
                ...eventVariant,
                pallet: palletVariant.name
            }
        })
    })
    return events
}


export function getEvent(d: ChainDescription, name: QualifiedName): EventDefinition {
    let events = getEvents(d)
    let def = events[name]
    if (def == null) {
        throw new Error(`Event ${name} not found`)
    }
    return def
}


const EVENTS_HASH_CACHE = new WeakMap<ChainDescription, Record<QualifiedName, string>>()


export function getEventHash(d: ChainDescription, name: QualifiedName): string {
    let hashes = EVENTS_HASH_CACHE.get(d)
    if (hashes == null) {
        hashes = {}
        EVENTS_HASH_CACHE.set(d, hashes)
    }
    let hash = hashes[name]
    if (hash == null) {
        hash = hashes[name] = computeEventHash(d, name)
    }
    return hash
}


function computeEventHash(d: ChainDescription, name: QualifiedName): string {
    let event = getEvent(d, name)
    let fields = event.fields.map(f => {
        return {
            name: f.name,
            type: getTypeHash(d.types, f.type)
        }
    })
    return sha256({
        name,
        fields
    })
}


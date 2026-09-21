import {describe, expect, it} from 'vitest'

import {augmentFields} from './augment'

describe('augmentFields', () => {
    it('adds a where-only field for filter evaluation and reports grew', () => {
        let {fields, grew} = augmentFields({log: {data: true}}, [{logs: [{address: ['0xa']}]}])
        expect(grew).toBe(true)
        expect(fields.log).toMatchObject({data: true, address: true})
    })

    it('does not grow when the filtered field is already selected for output', () => {
        let {fields, grew} = augmentFields({log: {address: true}}, [{logs: [{address: ['0xa']}]}])
        expect(grew).toBe(false)
        expect(fields.log).toMatchObject({address: true})
    })

    it('does not grow when no where-clause references an unselected field', () => {
        let {grew} = augmentFields({log: {data: true}}, [{logs: [{}]}])
        expect(grew).toBe(false)
    })

    it('flags a topic filter as needing log.topics', () => {
        let {fields, grew} = augmentFields({}, [{logs: [{topic0: ['0xt']}]}])
        expect(grew).toBe(true)
        expect((fields.log as any).topics).toBe(true)
    })

    it('maps trace where-keys onto the trace field selection', () => {
        let {fields, grew} = augmentFields({}, [{traces: [{createFrom: ['0xa'], callTo: ['0xb']}]}])
        expect(grew).toBe(true)
        expect(fields.trace).toMatchObject({createFrom: true, callTo: true})
    })

    it('adds transaction where fields (to/from/sighash)', () => {
        let {fields, grew} = augmentFields({}, [{transactions: [{to: ['0xb'], sighash: ['0x12345678']}]}])
        expect(grew).toBe(true)
        expect(fields.transaction).toMatchObject({to: true, sighash: true})
    })
})

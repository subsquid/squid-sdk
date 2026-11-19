import {describe, expect, it} from 'vitest'
import {type ComponentsRule, matchComponents} from './components'

const rule: ComponentsRule = {
    known: new Set(['blocks', 'uncles']),
    exact: new Map([['blocks', true]]),
}

describe('matchComponents', () => {
    it('requires the names the rule decides on', () => {
        expect(matchComponents('blocks', rule)).toBe(true)
        expect(matchComponents('uncles', rule)).toBe(false)
    })

    it('takes known names the rule does not decide on', () => {
        expect(matchComponents('blocks,uncles', rule)).toBe(true)
    })

    it('takes any check the publisher has made or skipped', () => {
        expect(matchComponents('blocks,v-block-hash,no-some-check', rule)).toBe(true)
    })

    it.each(['blocks,txs', 'blocks,v-', 'blocks,V-HASH', 'blocks,blocks', 'blocks,', 'blocks, uncles'])(
        'rejects "%s"',
        (tag) => {
            expect(matchComponents(tag, rule)).toBe(false)
        },
    )
})

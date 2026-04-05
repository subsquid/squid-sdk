/// <reference types="mocha" />
import assert from 'assert'
import {TemplateRegistry} from './template-registry'


function values(reg: TemplateRegistry, key: string) {
    return reg.get(key).map((e) => ({value: e.value, from: e.range.from, to: e.range.to}))
}


describe('TemplateRegistry', function () {
    describe('apply (add)', function () {
        it('new value returns true', function () {
            let reg = new TemplateRegistry()
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            assert.strictEqual(changed, true)
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: undefined}])
        })

        it('duplicate add with same from returns false', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            assert.strictEqual(changed, false)
        })

        it('duplicate add with later from returns false', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 200})
            assert.strictEqual(changed, false)
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: undefined}])
        })

        it('add with earlier from widens range', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 50})
            assert.strictEqual(changed, true)
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 50, to: undefined}])
        })

        it('multiple values under same key', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'add', key: 'log', value: '0xdef', blockNumber: 200})
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: undefined},
                {value: '0xdef', from: 200, to: undefined},
            ])
        })

        it('different keys are independent', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'add', key: 'instruction', value: '0xabc', blockNumber: 200})
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: undefined}])
            assert.deepStrictEqual(values(reg, 'instruction'), [{value: '0xabc', from: 200, to: undefined}])
        })
    })

    describe('apply (delete)', function () {
        it('deactivating active entry returns true', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            let changed = reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.strictEqual(changed, true)
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: 500}])
        })

        it('deactivating already deleted entry returns false', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            let changed = reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.strictEqual(changed, false)
        })

        it('deactivating unknown value returns false', function () {
            let reg = new TemplateRegistry()
            let changed = reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.strictEqual(changed, false)
        })

        it('deactivating unknown key returns false', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            let changed = reg.apply({type: 'delete', key: 'other', value: '0xabc', blockNumber: 500})
            assert.strictEqual(changed, false)
        })

        it('stale deactivation (to < from) is ignored', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            let changed = reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 50})
            assert.strictEqual(changed, false)
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: undefined}])
        })
    })

    describe('re-activation', function () {
        it('re-activation with from >= to creates new range', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 500})
            assert.strictEqual(changed, true)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xabc', from: 500, to: undefined},
            ])
        })

        it('re-activation with from < to returns false', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 300})
            assert.strictEqual(changed, false)
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: 500}])
        })

        it('re-activation after re-activation is idempotent', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 600})
            let changed = reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 600})
            assert.strictEqual(changed, false)
        })

        it('multiple deactivation/re-activation cycles', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 600})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 900})
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 1000})
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xabc', from: 600, to: 900},
                {value: '0xabc', from: 1000, to: undefined},
            ])
        })
    })

    describe('apply (add + delete combined)', function () {
        it('add and delete same value', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: 500}])
        })
    })

    describe('transact', function () {
        let range = {from: 0, to: 1000}

        it('returns pending data and changed flag', async function () {
            let reg = new TemplateRegistry()
            let result = await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
            })
            assert.strictEqual(result.changed, true)
            assert.deepStrictEqual(result.data, [{type: 'add', key: 'log', value: '0xabc', blockNumber: 100}])
        })

        it('commits on success', async function () {
            let reg = new TemplateRegistry()
            await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
            })
            let result = await reg.transact(range, async () => {})
            assert.strictEqual(result.changed, false)
            assert.deepStrictEqual(result.data, [])
        })

        it('rolls back on error', async function () {
            let reg = new TemplateRegistry()
            await assert.rejects(
                reg.transact(range, async (t) => {
                    t.add('log', '0xabc', 100)
                    throw new Error('fail')
                })
            )
            assert.deepStrictEqual(values(reg, 'log'), [])
        })

        it('rolls back delete on error', async function () {
            let reg = new TemplateRegistry()
            await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
            })
            await assert.rejects(
                reg.transact(range, async (t) => {
                    t.remove('log', '0xabc', 500)
                    throw new Error('fail')
                })
            )
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: undefined}])
        })

        it('rolls back range widening on error', async function () {
            let reg = new TemplateRegistry()
            await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
            })
            await assert.rejects(
                reg.transact(range, async (t) => {
                    t.add('log', '0xabc', 50)
                    throw new Error('fail')
                })
            )
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: undefined}])
        })

        it('rolls back re-activation on error', async function () {
            let reg = new TemplateRegistry()
            await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
                t.remove('log', '0xabc', 500)
            })
            await assert.rejects(
                reg.transact(range, async (t) => {
                    t.add('log', '0xabc', 600)
                    throw new Error('fail')
                })
            )
            assert.deepStrictEqual(values(reg, 'log'), [{value: '0xabc', from: 100, to: 500}])
        })

        it('rolls back multiple operations on error', async function () {
            let reg = new TemplateRegistry()
            await assert.rejects(
                reg.transact(range, async (t) => {
                    t.add('log', '0xabc', 100)
                    t.add('log', '0xdef', 200)
                    throw new Error('fail')
                })
            )
            assert.deepStrictEqual(values(reg, 'log'), [])
        })

        it('returns data even when registry already has the values', async function () {
            let reg = new TemplateRegistry()
            await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
            })
            let result = await reg.transact(range, async (t) => {
                t.add('log', '0xabc', 100)
            })
            assert.strictEqual(result.changed, false)
            assert.deepStrictEqual(result.data, [{type: 'add', key: 'log', value: '0xabc', blockNumber: 100}])
        })

        it('rejects blockNumber before batch start', async function () {
            let reg = new TemplateRegistry()
            await assert.rejects(
                reg.transact({from: 100, to: 200}, async (t) => {
                    t.add('log', '0xabc', 50)
                }),
                RangeError
            )
        })
    })

    describe('has', function () {
        it('returns true for active value at block', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            assert.strictEqual(reg.has('log', '0xabc', 150), true)
        })

        it('returns false before activation block', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            assert.strictEqual(reg.has('log', '0xabc', 50), false)
        })

        it('returns true at exact activation block', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            assert.strictEqual(reg.has('log', '0xabc', 100), true)
        })

        it('returns true at deactivation block', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.strictEqual(reg.has('log', '0xabc', 500), true)
        })

        it('returns false after deactivation block', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.strictEqual(reg.has('log', '0xabc', 501), false)
        })

        it('returns false for unknown key', function () {
            let reg = new TemplateRegistry()
            assert.strictEqual(reg.has('log', '0xabc', 100), false)
        })

        it('returns false for unknown value', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            assert.strictEqual(reg.has('log', '0xdef', 100), false)
        })
    })

    describe('get', function () {
        it('returns empty for unknown key', function () {
            let reg = new TemplateRegistry()
            assert.deepStrictEqual(reg.get('log'), [])
        })

        it('includes deleted entries with their range', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.apply({type: 'add', key: 'log', value: '0xdef', blockNumber: 200})
            reg.apply({type: 'delete', key: 'log', value: '0xabc', blockNumber: 500})
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xdef', from: 200, to: undefined},
            ])
        })
    })

    describe('init', function () {
        it('rebuilds state from mutations', function () {
            let reg = new TemplateRegistry()
            reg.init([
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 100},
                {type: 'add', key: 'log', value: '0xdef', blockNumber: 200},
                {type: 'delete', key: 'log', value: '0xdef', blockNumber: 500},
            ])
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: undefined},
                {value: '0xdef', from: 200, to: 500},
            ])
        })

        it('handles out-of-order mutations by sorting', function () {
            let reg = new TemplateRegistry()
            reg.init([
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 600},
                {type: 'delete', key: 'log', value: '0xabc', blockNumber: 500},
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 100},
            ])
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xabc', from: 600, to: undefined},
            ])
        })

        it('handles delete-then-add at same block', function () {
            let reg = new TemplateRegistry()
            reg.init([
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 100},
                {type: 'delete', key: 'log', value: '0xabc', blockNumber: 500},
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 500},
            ])
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xabc', from: 500, to: undefined},
            ])
        })

        it('clears previous state', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.init([
                {type: 'add', key: 'log', value: '0xdef', blockNumber: 200},
            ])
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xdef', from: 200, to: undefined},
            ])
        })

        it('clears undo history', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.init([
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 100},
            ])
            reg.rollbackTo(-1)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: undefined},
            ])
        })

        it('replays hot block mutations with undo log', function () {
            let reg = new TemplateRegistry()
            reg.init(
                [{type: 'add', key: 'log', value: '0xabc', blockNumber: 100}],
                [
                    {blockNumber: 1001, templates: [{type: 'add', key: 'log', value: '0xdef', blockNumber: 200}]},
                    {blockNumber: 1002, templates: [{type: 'delete', key: 'log', value: '0xabc', blockNumber: 500}]},
                ]
            )
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xdef', from: 200, to: undefined},
            ])

            reg.rollbackTo(1001)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: undefined},
                {value: '0xdef', from: 200, to: undefined},
            ])

            reg.rollbackTo(-1)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: undefined},
            ])
        })

        it('hot block rollback fully restores finalized state', function () {
            let reg = new TemplateRegistry()
            reg.init(
                [
                    {type: 'add', key: 'log', value: '0xabc', blockNumber: 100},
                    {type: 'delete', key: 'log', value: '0xabc', blockNumber: 500},
                ],
                [
                    {blockNumber: 1001, templates: [{type: 'add', key: 'log', value: '0xabc', blockNumber: 600}]},
                ]
            )
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
                {value: '0xabc', from: 600, to: undefined},
            ])

            reg.rollbackTo(-1)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: 500},
            ])
        })
    })

    describe('rollbackTo', function () {
        it('undoes changes after given block', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            reg.rollbackTo(100)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
            ])
        })

        it('cleans up empty maps after undo', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            reg.rollbackTo(-1)
            assert.deepStrictEqual(reg.get('log'), [])
        })

        it('rollback at exact undo entry boundary keeps that entry', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            reg.rollbackTo(200)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
                {value: '0xdef', from: 150, to: undefined},
            ])
        })

        it('rollback beyond all entries is a no-op', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            reg.rollbackTo(500)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
            ])
        })
    })

    describe('prune', function () {
        it('is a no-op when target is before all undo entries', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            reg.prune(-1)
            reg.rollbackTo(-1)
            assert.deepStrictEqual(values(reg, 'log'), [])
        })

        it('moves undo entries at or below target into base mutations', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            reg.prune(100)
            reg.rollbackTo(-1)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
            ])
        })

        it('moves all undo entries when target is beyond all', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            reg.prune(500)
            reg.rollbackTo(-1)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
                {value: '0xdef', from: 150, to: undefined},
            ])
        })

        it('preserves state after pruning', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            reg.prune(100)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
                {value: '0xdef', from: 150, to: undefined},
            ])
        })

        it('prune then rollback only undoes un-pruned entries', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            await reg.transact({from: 101, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            await reg.transact({from: 201, to: 300}, async (t) => {
                t.add('log', '0xghi', 250)
            })
            reg.prune(200)
            reg.rollbackTo(200)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 50, to: undefined},
                {value: '0xdef', from: 150, to: undefined},
            ])
        })
    })

    describe('has (via transact)', function () {
        it('sees template added in the same transaction', async function () {
            let reg = new TemplateRegistry()
            let seen = false
            await reg.transact({from: 0, to: 200}, async (t) => {
                t.add('log', '0xabc', 100)
                seen = t.has('log', '0xabc', 150)
            })
            assert.strictEqual(seen, true)
        })

        it('sees template from a previous transaction', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            let seen = false
            await reg.transact({from: 101, to: 200}, async (t) => {
                seen = t.has('log', '0xabc', 150)
            })
            assert.strictEqual(seen, true)
        })

        it('does not see template at block before activation', async function () {
            let reg = new TemplateRegistry()
            let seen = true
            await reg.transact({from: 0, to: 200}, async (t) => {
                t.add('log', '0xabc', 100)
                seen = t.has('log', '0xabc', 50)
            })
            assert.strictEqual(seen, false)
        })

        it('does not see deleted template after deactivation block', async function () {
            let reg = new TemplateRegistry()
            await reg.transact({from: 0, to: 100}, async (t) => {
                t.add('log', '0xabc', 50)
            })
            let seen = true
            await reg.transact({from: 101, to: 600}, async (t) => {
                t.remove('log', '0xabc', 500)
                seen = t.has('log', '0xabc', 501)
            })
            assert.strictEqual(seen, false)
        })
    })

    describe('edge cases', function () {
        it('transact with no mutations returns changed: false and empty data', async function () {
            let reg = new TemplateRegistry()
            let result = await reg.transact({from: 0, to: 100}, async () => {})
            assert.strictEqual(result.changed, false)
            assert.deepStrictEqual(result.data, [])
        })

        it('init with empty mutations array clears state', function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xabc', blockNumber: 100})
            reg.init([])
            assert.deepStrictEqual(reg.get('log'), [])
        })

        it('init then transact works on clean state', async function () {
            let reg = new TemplateRegistry()
            reg.apply({type: 'add', key: 'log', value: '0xold', blockNumber: 10})
            reg.init([
                {type: 'add', key: 'log', value: '0xabc', blockNumber: 100},
            ])
            let result = await reg.transact({from: 100, to: 200}, async (t) => {
                t.add('log', '0xdef', 150)
            })
            assert.strictEqual(result.changed, true)
            assert.deepStrictEqual(values(reg, 'log'), [
                {value: '0xabc', from: 100, to: undefined},
                {value: '0xdef', from: 150, to: undefined},
            ])
        })
    })
})

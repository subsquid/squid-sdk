import {GetBlock, removeVoteTransactions} from '@subsquid/solana-rpc-data'
import {toJSON} from '@subsquid/util-internal-json'
import {fixUnsafeIntegers} from '@subsquid/util-internal-json-fix-unsafe-integers'
import assert, {fail} from 'assert'
import * as fs from 'fs'
import {it} from 'node:test'
import * as Path from 'path'
import {Journal, mapRpcBlock} from './mapping'


const FIXTURES_DIR = Path.resolve(__dirname, '../fixtures')


interface Fixture {
    name: string
    block: GetBlock
    result: any
}


function* listFixtures(): Iterable<Fixture> {
    for (let name of fs.readdirSync(FIXTURES_DIR)) {
        let block: GetBlock
        let result: any
        try {
            block = JSON.parse(
                fixUnsafeIntegers(fs.readFileSync(Path.join(FIXTURES_DIR, name, 'block.json'), 'utf-8'))
            )
            result = JSON.parse(
                fs.readFileSync(Path.join(FIXTURES_DIR, name, 'result.json'), 'utf-8')
            )
        } catch(err: any) {
            if (err.code === 'ENOENT' || err.code == 'ENOTDIR') {
                continue
            } else {
                throw err
            }
        }
        yield {name, block, result}
    }
}


const failingJournal: Journal = {
    warn(props: any, msg: string) {
        throw new Error(`got warning: ${msg}, props: ${JSON.stringify(props)}`)
    },
    error(props: any, msg: string) {
        throw new Error(`got error: ${msg}, props: ${JSON.stringify(props)}`)
    }
}


for (let fix of listFixtures()) {
    removeVoteTransactions(fix.block)
    it(fix.name, () => {
        let result = mapRpcBlock(0, fix.block, failingJournal)
        let resultJson = normalizeJson(result)
        try {
            assert.deepStrictEqual(resultJson, fix.result)
        } catch(err: any) {
            // diff, that comes from deepStrictEqual is not useful for large objects
            fs.writeFileSync(
                Path.join(FIXTURES_DIR, fix.name, 'result.temp.json'),
                JSON.stringify(resultJson, null, 2)
            )
            fail('result is different from a reference')
        }
    })
}


function normalizeJson(obj: any): any {
    return JSON.parse(JSON.stringify(toJSON(obj)))
}

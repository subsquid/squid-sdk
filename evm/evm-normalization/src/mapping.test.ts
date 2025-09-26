import {Block} from '@subsquid/evm-rpc'
import {toJSON} from '@subsquid/util-internal-json'
import assert, {fail} from 'assert'
import * as fs from 'fs'
import {it} from 'node:test'
import * as Path from 'path'
import {mapRpcBlock} from './mapping'


const FIXTURES_DIR = Path.resolve(__dirname, '../fixtures')


interface Fixture {
    name: string
    readBlock(): Block
    readResult(): any
}


function* listFixtures(): Iterable<Fixture> {
    for (let name of fs.readdirSync(FIXTURES_DIR)) {
        let blocksPath = Path.join(FIXTURES_DIR, name, 'block.json')
        let resultPath = Path.join(FIXTURES_DIR, name, 'result.json')
        if (fs.existsSync(blocksPath) && fs.existsSync(resultPath)) {
            yield {
                name,
                readBlock(): Block {
                    return JSON.parse(fs.readFileSync(blocksPath, 'utf-8'))
                },
                readResult(): any {
                    return JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
                }
            }
        }
    }
}


for (let fix of listFixtures()) {
    it(fix.name, () => {
        let block = fix.readBlock()
        let expected = fix.readResult()

        let actual = mapRpcBlock(block, true, true)
        actual = normalizeJson(actual)
        try {
            assert.deepStrictEqual(actual, expected)
        } catch(err: any) {
            // diff, that comes from deepStrictEqual is not useful for large objects
            fs.writeFileSync(
                Path.join(FIXTURES_DIR, fix.name, 'result.temp.json'),
                JSON.stringify(actual, null, 2)
            )
            fail('result is different from a reference')
        }
    })
}


function normalizeJson(obj: any): any {
    return JSON.parse(JSON.stringify(toJSON(obj)))
}

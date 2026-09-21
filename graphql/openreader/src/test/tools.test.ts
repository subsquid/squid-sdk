import * as path from "path"
import {loadModel} from "../tools"

function fixture(name: string): string {
    return path.join(__dirname, '../../fixtures', name)
}

describe('tools', function () {
    describe('loadModel()', function () {
        it('loads model from a single file', function () {
            let model = loadModel(fixture('schema.graphql'))
            expect(model).toMatchObject({
                Account: {kind: 'entity'},
                HistoricalBalance: {kind: 'entity'}
            })
        })

        it('loads model from a directory', function () {
            let model = loadModel(fixture('schema'))
            expect(model).toMatchObject({
                Account: {kind: 'entity'},
                HistoricalBalance: {kind: 'entity'}
            })
        })
    })
})

import {Command} from '@oclif/core'
import {loadModel} from '@subsquid/openreader/dist/tools'
import {OutDir, resolveGraphqlSchema} from '@subsquid/util'
import * as fs from 'fs'
import {generateOrmModels} from '../codegen'
import {generateFtsMigrations} from '../fts'

export default class Codegen extends Command {
    static description = 'Analyze graphql schema and generate ORM model files'

    async run(): Promise<void> {
        let model = loadModel(resolveGraphqlSchema())
        let orm = new OutDir('src/model')
        let generatedOrm = orm.child('generated')

        generatedOrm.del()
        generateOrmModels(model, generatedOrm)
        if (!fs.existsSync(orm.path('index.ts'))) {
            let index = orm.file('index.ts')
            index.line(`export * from "./generated"`)
            index.write()
        }

        generateFtsMigrations(model, new OutDir('db/migrations'))
    }
}

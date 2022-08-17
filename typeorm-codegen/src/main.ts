import {loadModel, resolveGraphqlSchema} from "@subsquid/openreader/lib/tools"
import {runProgram} from "@subsquid/util-internal"
import {OutDir} from "@subsquid/util-internal-code-printer"
import {Command} from "commander"
import fs from "fs"
import {generateOrmModels} from "./codegen"
import {generateFtsMigrations} from "./fts"


runProgram(async () => {
    let program = new Command()

    program.description(`
Generates TypeORM entity classes from squid GraphQL schema.

This tool doesn't have any option. It locates GraphQL schema according 
to squid's conventions and places the resulting models at src/model/generated
and db migrations (if any) at db/migrations. 
    `.trim())

    program.parse()

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
})

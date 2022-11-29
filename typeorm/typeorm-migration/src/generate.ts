import {createOrmConfig, MIGRATIONS_DIR} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {OutDir} from "@subsquid/util-internal-code-printer"
import {program} from "commander"
import * as dotenv from "dotenv"
import {DataSource} from "typeorm"
import {Query} from "typeorm/driver/Query"
import {SqlInMemory} from "typeorm/driver/SqlInMemory"


runProgram(async () => {
    program.description('Analyze the current database state and generate migration to match the target schema')
    program.option('-n, --name <name>', 'name suffix for new migration', 'Data')

    let {name} = program.parse().opts() as {name: string}

    dotenv.config()

    let connection = new DataSource({
        ...createOrmConfig(),
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: false
    })

    await connection.initialize()

    let commands: SqlInMemory
    try {
        commands = await connection.driver.createSchemaBuilder().log()
    } finally {
        await connection.destroy().catch(() => null)
    }

    if (commands.upQueries.length == 0) {
        console.error('No changes in database schema were found - cannot generate a migration.')
        process.exit(1)
    }

    let dir = new OutDir(MIGRATIONS_DIR)
    let timestamp = Date.now()
    let out = dir.file(`${timestamp}-${name}.js`)
    out.block(`module.exports = class ${name}${timestamp}`, () => {
        out.line(`name = '${name}${timestamp}'`)
        out.line()
        out.block(`async up(db)`, () => {
            commands.upQueries.forEach(q => {
                out.line(`await db.query${queryTuple(q)}`)
            })
        })
        out.line()
        out.block(`async down(db)`, () => {
            commands.downQueries.forEach(q => {
                out.line(`await db.query${queryTuple(q)}`)
            })
        })
    })
    out.write()
})


function queryTuple(q: Query): string {
    let params = q.parameters?.length ? ', ' + JSON.stringify(q.parameters) : ''
    return '(`' + q.query + '`' + params + ')'
}

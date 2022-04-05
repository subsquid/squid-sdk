import { CliUx, Command } from '@oclif/core';
import {createOrmConfig} from "@subsquid/typeorm-config"
import {assertNotNull, OutDir} from "@subsquid/util"
import * as dotenv from 'dotenv'
import {ConnectionOptions, createConnection} from "typeorm"
import {Query} from "typeorm/driver/Query"
import {SqlInMemory} from "typeorm/driver/SqlInMemory"


export default class CreateMigration extends Command {
    static description =
        'Analyze database state and generate migration to match the target schema'

    static args = [{name: 'name'}]

    async run(): Promise<void> {
        dotenv.config()

        let {args} = await this.parse(CreateMigration)
        let name: string = args.name ? args.name : await CliUx.ux.prompt('Enter migration name', {
            required: true,
        })

        let cfg: ConnectionOptions = {
            ...createOrmConfig(),
            synchronize: false,
            migrationsRun: false,
            dropSchema: false,
            logging: false
        }

        let commands: SqlInMemory
        let connection = await createConnection(cfg)
        try {
            commands = await connection.driver.createSchemaBuilder().log()
        } finally {
            await connection.close().catch(err => null)
        }

        if (commands.upQueries.length == 0) {
            this.error('No changes in database schema were found - cannot generate a migration.')
        }

        let dir = new OutDir(assertNotNull(cfg.cli?.migrationsDir))
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
    }
}


function queryTuple(q: Query): string {
    let params = q.parameters?.length ? ', ' + JSON.stringify(q.parameters) : ''
    return '(`' + q.query + '`' + params + ')'
}

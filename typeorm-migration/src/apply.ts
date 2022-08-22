import {createOrmConfig} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {program} from "commander"
import * as dotenv from "dotenv"
import {DataSource} from "typeorm"
import {DatabaseType} from "typeorm/driver/types/DatabaseType";


runProgram(async () => {
    program.description('Apply pending migrations')
    program.option('-rdbms, --rdbmsType <type>', 'RDBMS type')

    dotenv.config()

    let { rdbmsType: rdbmsTypeCli } = program.parse().opts() as {rdbmsType: DatabaseType}
    let rdbmsType = rdbmsTypeCli || process.env.RDBMS_TYPE || 'postgres'

    let connection = new DataSource({
        ...createOrmConfig({rdbmsType}),
        subscribers: [],
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: ["query", "error", "schema"],
    })

    await connection.initialize()

    try {
        await connection.runMigrations({transaction: 'all'})
    } finally {
        await connection.destroy().catch(() => null)
    }
})

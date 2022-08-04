import {createOrmConfig} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {program} from "commander"
import * as dotenv from "dotenv"
import {DataSource} from "typeorm"
import {DatabaseType} from "typeorm/driver/types/DatabaseType";


runProgram(async () => {
    program.description('Revert the last applied migration')
    program.option('-rdbms, --rdbmsType <type>', 'RDBMS type', 'postgres')
    let {rdbmsType} = program.parse().opts() as {rdbmsType: DatabaseType}

    dotenv.config()

    let connection = new DataSource({
        ...createOrmConfig({rdbmsType}),
        subscribers: [],
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: ["query", "error", "schema"]
    })

    await connection.initialize()

    try {
        await connection.undoLastMigration({transaction: 'all'})
    } finally {
        await connection.destroy().catch(() => null)
    }
})

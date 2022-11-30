import {createOrmConfig} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {program} from "commander"
import * as dotenv from "dotenv"
import {DataSource} from "typeorm"


runProgram(async () => {
    program.description('Apply pending migrations').parse()

    dotenv.config()

    let connection = new DataSource({
        ...createOrmConfig(),
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

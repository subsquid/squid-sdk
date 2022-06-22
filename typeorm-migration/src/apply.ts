import {createOrmConfig} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {program} from "commander"
import * as dotenv from "dotenv"
import {ConnectionOptions, createConnection} from "typeorm"


runProgram(async () => {
    program.description('Apply pending migrations').parse()

    dotenv.config()

    let cfg: ConnectionOptions = {
        ...createOrmConfig(),
        subscribers: [],
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: ["query", "error", "schema"],
    }

    let connection = await createConnection(cfg)
    try {
        await connection.runMigrations({transaction: 'all'})
    } finally {
        await connection.close().catch(err => null)
    }
})

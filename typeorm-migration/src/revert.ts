import {createOrmConfig} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {program} from "commander"
import * as dotenv from "dotenv"
import {ConnectionOptions, createConnection} from "typeorm"


runProgram(async () => {
    program.description('Revert the last applied migration').parse()

    dotenv.config()

    let cfg: ConnectionOptions = {
        ...createOrmConfig(),
        subscribers: [],
        synchronize: false,
        migrationsRun: false,
        dropSchema: false,
        logging: ["query", "error", "schema"]
    }

    let connection = await createConnection(cfg)
    try {
        await connection.undoLastMigration({transaction: 'all'})
    } finally {
        await connection.close().catch(err => null)
    }
})

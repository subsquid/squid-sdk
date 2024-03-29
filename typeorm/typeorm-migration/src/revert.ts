import {createOrmConfig} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {registerTsNodeIfRequired} from '@subsquid/util-internal-ts-node'
import {program} from "commander"
import * as dotenv from "dotenv"
import {DataSource} from "typeorm"


runProgram(async () => {
    program.description('Revert the last applied migration').parse()

    dotenv.config()

    await registerTsNodeIfRequired()

    let connection = new DataSource({
        ...createOrmConfig(),
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

import {createOrmConfig} from "@subsquid/typeorm-config"
import {getDataSchema} from "@subsquid/typeorm-config/lib/connectionOptions"
import {runProgram} from "@subsquid/util-internal"
import {registerTsNodeIfRequired} from '@subsquid/util-internal-ts-node'
import {program} from "commander"
import * as dotenv from "dotenv"
import {DataSource} from "typeorm"


runProgram(async () => {
    program.description('Apply pending migrations').parse()

    dotenv.config()

    await registerTsNodeIfRequired()

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
        // When DB_SCHEMA is set the connection's search_path points at it, so
        // unqualified migration DDL (and TypeORM's own `migrations` ledger) land
        // there. The schema must exist first: with a schema-only search_path
        // Postgres has nowhere to create tables otherwise.
        //
        // Left unquoted so Postgres folds the name exactly as it does in the
        // (unquoted) search_path — quoting here would preserve case and could
        // create a different schema than the one migrations target. Safe from
        // injection: getDataSchema() validates DB_SCHEMA as a plain identifier.
        let schema = getDataSchema()
        if (schema) {
            await connection.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
        }
        await connection.runMigrations({transaction: 'all'})
    } finally {
        await connection.destroy().catch(() => null)
    }
})

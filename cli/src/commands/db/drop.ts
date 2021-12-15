import {Command} from '@oclif/core'
import {createConnectionOptions} from "@subsquid/typeorm-config"
import * as dotenv from 'dotenv'
// @ts-ignore
import pgtools = require('pgtools')


export default class DropDb extends Command {
    static description = 'Drop database'

    async run(): Promise<void> {
        dotenv.config()
        let cfg = createConnectionOptions()
        try {
            await pgtools.dropdb(
                {
                    host: cfg.host,
                    port: cfg.port,
                    user: cfg.username,
                    password: cfg.password,
                },
                cfg.database
            )
        } catch(e: any) {
            if (e?.name === 'invalid_catalog_name') {
                this.log(`Database '${cfg.database}' does not exist`)
            } else {
                this.error(e)
            }
        }
    }
}

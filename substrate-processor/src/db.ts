import {createOrmConfig} from "@subsquid/typeorm-config"
import assert from "assert"
import {Connection, createConnection} from "typeorm"
import {Store} from "./interfaces/handlerContext"


export interface ProcessingStatus {
    height: number
}


export class Db {
    static async connect(): Promise<Db> {
        let cfg = createOrmConfig()
        let con = await createConnection(cfg)
        return new Db(con)
    }

    constructor(private con: Connection) {}

    init(processor: string): Promise<ProcessingStatus> {
        // FIXME: validate processorName, version checking, etc...
        let schema = `"${processor}_status"`
        return this.con.transaction(async em => {
            await em.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
            await em.query(`
              CREATE TABLE IF NOT EXISTS ${schema}."status" (
                id int primary key,
                height int not null
              )
            `)
            let status: ProcessingStatus[] = await em.query(
                `SELECT height FROM ${schema}.status WHERE id = 0`
            )
            if (status.length == 0) {
                await em.query(`INSERT INTO ${schema}.status (id, height) VALUES (0, -1)`)
                return {height: -1}
            } else {
                return status[0]
            }
        })
    }

    transact(processor: string, blockNumber: number, cb: (em: Store) => Promise<void>): Promise<void> {
        let schema = `"${processor}_status"`
        return this.con.transaction('SERIALIZABLE', async em => {
            let status: ProcessingStatus[] = await em.query(
                `SELECT height FROM ${schema}.status`
            )
            assert(status.length == 1)
            assert(status[0].height < blockNumber)
            let store = em as Store
            store.get = em.findOne
            await cb(store)
            await em.query(`UPDATE ${schema}.status SET height = $1`, [blockNumber])
        })
    }

    async setHeight(processor: string, blockNumber: number): Promise<void> {
        let schema = `"${processor}_status"`
        await this.con.query(`UPDATE ${schema}.status SET height = $1 WHERE height < $1`, [blockNumber])
        // TODO: update assertion
    }

    close(): Promise<void> {
        return this.con.close()
    }
}




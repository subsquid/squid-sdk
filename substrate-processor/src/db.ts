import {createOrmConfig} from "@subsquid/typeorm-config"
import assert from "assert"
import {Connection, createConnection, EntityManager} from "typeorm"
import {Store} from "./interfaces/store"


export interface ProcessingStatus {
    height: number
}


export type IsolationLevel = 'SERIALIZABLE' | 'READ COMMITTED' | 'REPEATABLE READ'


export interface DbOptions {
    processorName: string
    isolationLevel?: IsolationLevel
}


export class Db {
    static async connect(options: DbOptions): Promise<Db> {
        let cfg = createOrmConfig()
        let con = await createConnection(cfg)
        return new Db(con, options)
    }

    private statusSchema: string
    private isolationLevel: IsolationLevel
    private maxTxAttempts = 3

    constructor(private con: Connection, options: DbOptions) {
        this.isolationLevel = options.isolationLevel || 'SERIALIZABLE'
        this.statusSchema = `"${options.processorName}_status"`
    }

    init(): Promise<ProcessingStatus> {
        return this.con.transaction('SERIALIZABLE', async em => {
            await em.query(`CREATE SCHEMA IF NOT EXISTS ${this.statusSchema}`)
            await em.query(`
              CREATE TABLE IF NOT EXISTS ${this.statusSchema}."status" (
                id int primary key,
                height int not null
              )
            `)
            let status: ProcessingStatus[] = await em.query(
                `SELECT height FROM ${this.statusSchema}.status WHERE id = 0`
            )
            if (status.length == 0) {
                await em.query(`INSERT INTO ${this.statusSchema}.status (id, height) VALUES (0, -1)`)
                return {height: -1}
            } else {
                return status[0]
            }
        })
    }

    private async tx(cb: (em: EntityManager) => Promise<void>, attempt: number = 1): Promise<number> {
        try {
            await this.con.transaction(this.isolationLevel, cb)
            return attempt
        } catch(e: any) {
            if (e.code == '40001' && attempt < this.maxTxAttempts) {
                return this.tx(cb, attempt + 1)
            } else {
                throw e
            }
        }
    }

    transact(blockNumber: number, cb: (em: Store) => Promise<void>): Promise<number> {
        return this.tx(async em => {
            let status: ProcessingStatus[] = await em.query(
                `SELECT height FROM ${this.statusSchema}.status`
            )
            assert(status.length == 1)
            assert(status[0].height < blockNumber)
            let store = em as Store
            store.get = function(entityClass, cond) {
                if (typeof cond == 'string') {
                    return this.findOne(entityClass, {where: {id: cond}})
                } else {
                    return this.findOne(entityClass, cond)
                }
            }
            await cb(store)
            await em.query(`UPDATE ${this.statusSchema}.status SET height = $1`, [blockNumber])
        })
    }

    async setHeight(blockNumber: number): Promise<void> {
        await this.con.query(`UPDATE ${this.statusSchema}.status SET height = $1 WHERE height < $1`, [blockNumber])
        // TODO: update assertion
    }

    close(): Promise<void> {
        return this.con.close()
    }
}




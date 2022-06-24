import type {Database, Transaction} from "@subsquid/openreader/dist/db"
import type {DataSource, EntityManager} from "typeorm"


export class EMDatabase implements Database {
    constructor(private em: EntityManager) {}

    async query(sql: string, parameters?: any[]): Promise<any[][]> {
        let records: any[] = await this.em.query(sql, parameters)
        let rows: any[][] = new Array(records.length)
        let len = 0
        for (let i = 0; i < records.length; i++) {
            let rec = records[i]
            let row: any[] = new Array(len)
            let j = 0
            for (let key in rec) {
                row[j] = rec[key]
                j += 1
            }
            len = j
            rows[i] = row
        }
        return rows
    }

    escapeIdentifier(name: string): string {
        return this.em.connection.driver.escape(name)
    }
}


interface Tx {
    em: EntityManager
    db: Database
    close(): void
}


export class TypeormTransaction implements Transaction {
    private tx: Promise<Tx> | undefined
    private closed = false

    constructor(private con: DataSource) {}

    async get(): Promise<Database> {
        let tx = await this.getTx()
        return tx.db
    }

    async getEntityManager(): Promise<EntityManager> {
        let tx = await this.getTx()
        return tx.em
    }

    private getTx(): Promise<Tx> {
        if (this.closed) {
            throw new Error('Too late to request transaction')
        }
        if (this.tx) return this.tx
        return this.tx = new Promise((resolve, reject) => {
            this.con.transaction('SERIALIZABLE', (em) => {
                return new Promise((close) => {
                    resolve({
                        em,
                        db: new EMDatabase(em),
                        close: () => close(undefined)
                    })
                })
            }).catch((err) => reject(err))
        })
    }

    close(): void {
        this.closed = true
        this.tx?.then(tx => tx.close()).catch(() => {})
    }
}

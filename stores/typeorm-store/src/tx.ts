import type {Connection, EntityManager} from "typeorm"
import type {IsolationLevel} from "./database"


export interface Tx {
    em: EntityManager
    commit(): Promise<void>
    rollback(): Promise<void>
}


export function createTransaction(con: Connection, isolationLevel: IsolationLevel): Promise<Tx> {
    return new Promise((resolve, reject) => {
        let done: Promise<void> = con.transaction(isolationLevel, em => {
            return new Promise((commit, rollback) => {
                resolve({
                    em,
                    commit() {
                        commit()
                        return done
                    },
                    rollback() {
                        rollback(ROLLBACK_ERROR)
                        return done.catch(err => {
                            if (err !== ROLLBACK_ERROR) {
                                throw err
                            }
                        })
                    }
                })
            })
        })
        done.catch(err => {
            if (err !== ROLLBACK_ERROR) {
                reject(err)
            }
        })
    })
}


const ROLLBACK_ERROR = new Error('rollback')

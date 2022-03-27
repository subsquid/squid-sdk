import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {readOldTypesBundle} from "@subsquid/substrate-metadata"
import {Progress, Speed} from "@subsquid/util-internal-counters"
import {ServiceManager} from "@subsquid/util-internal-service-manager"
import assert from "assert"
import {Command} from "commander"
import * as fs from "fs"
import path from "path"
import * as pg from "pg"
import {migrate} from "postgres-migrations"
import {Ingest} from "./ingest"
import {PostgresSink, Sink, WritableSink} from "./sink"


ServiceManager.run(async sm => {
    let program = new Command()

    program.description('Data dumper for substrate based chains')

    program.option('-e, --endpoint <url...>', 'WS rpc endpoint')
    program.option('--types-bundle <file>', 'JSON file with custom type definitions')
    program.option('--out <sink>', 'Name of a file or postgres connection string')
    program.option('--start-block <number>', 'Height of the block from which to start processing', positiveInteger)

    let options = program.parse().opts() as {
        endpoint: string[]
        out?: string
        typesBundle?: string
        startBlock?: number
    }

    let typesBundle = options.typesBundle == null
        ? undefined
        : readOldTypesBundle(options.typesBundle)

    let startBlock = options.startBlock || 0
    let writeSpeed = new Speed()
    let progress = new Progress()
    progress.setInitialValue(startBlock)

    let clients = options.endpoint.map(url => sm.add(new ResilientRpcClient(url)))

    let sink: Sink
    if (options.out) {
        if (options.out.startsWith('postgres://')) {
            let db = new pg.Client({
                connectionString: options.out
            })
            sm.add({
                close() {
                    return db.end()
                }
            })
            await db.connect()
            await migrate({client: db}, path.resolve(__dirname, '../migrations'), {
                logger: msg => console.error(msg)
            })
            let height = await getDbHeight(db)
            startBlock = Math.max(startBlock, height == null ? 0 : height + 1)
            progress.setCurrentValue(startBlock)
            sink = new PostgresSink({
                db,
                speed: writeSpeed,
                progress
            })
        } else {
            let out = fs.createWriteStream(options.out, {flags: 'a'})
            sm.add({
                close() {
                    return new Promise((resolve, reject) => {
                        out.on('error', err => reject(err))
                        out.on('close', () => resolve())
                        out.end()
                    })
                }
            })
            progress.setCurrentValue(startBlock)
            sink = new WritableSink({
                writable: out,
                speed: writeSpeed,
                progress
            })
        }
    } else {
        progress.setCurrentValue(startBlock)
        sink = new WritableSink({
            writable: process.stdout,
            speed: writeSpeed,
            progress
        })
    }

    sm.every(5000, () => {
        progress.tick()
        console.error(`last block: ${progress.getCurrentValue()}, processing: ${Math.round(progress.speed())} blocks/sec, writing: ${Math.round(writeSpeed.speed())} blocks/sec`)
    })

    let blocks = Ingest.getBlocks({
        clients,
        typesBundle,
        startBlock
    })

    for await (let block of blocks) {
        sm.abort.assertNotAborted()
        await sink.write(block)
    }
})


async function getDbHeight(db: pg.ClientBase): Promise<number | undefined> {
    let res = await db.query("SELECT height FROM block ORDER BY height DESC LIMIT 1")
    if (res.rowCount) {
        return res.rows[0].height
    } else {
        return undefined
    }
}


function positiveInteger(s: string): number {
    let n = parseInt(s)
    assert(Number.isInteger(n) && n >= 0)
    return n
}

import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {readOldTypesBundle} from "@subsquid/substrate-metadata"
import {runProgram} from "@subsquid/util-internal"
import {Progress, Speed} from "@subsquid/util-internal-counters"
import assert from "assert"
import {Command} from "commander"
import * as fs from "fs"
import path from "path"
import * as pg from "pg"
import {migrate} from "postgres-migrations"
import {Client} from "./client"
import {Ingest} from "./ingest"
import {PostgresSink, Sink, WritableSink} from "./sink"


runProgram(async () => {
    let program = new Command()

    program.description('Data dumper for substrate based chains')

    program.option('-e, --endpoint <url...>', 'WS rpc endpoint')
    program.option('--types-bundle <file>', 'JSON file with custom type definitions')
    program.option('--out <sink>', 'Name of a file or postgres connection string')
    program.option('--start-block <number>', 'Height of the block from which to start processing', positiveInteger)
    program.option(
        '--write-batch-size <number>',
        'A number of blocks to write in one transaction (applies only to postgres sink)',
        positiveInteger
    )

    let options = program.parse().opts() as {
        endpoint: string[]
        out?: string
        typesBundle?: string
        startBlock?: number
        writeBatchSize?: number
    }

    let typesBundle = options.typesBundle == null
        ? undefined
        : readOldTypesBundle(options.typesBundle)

    let startBlock = options.startBlock || 0
    let writeSpeed = new Speed()
    let progress = new Progress()
    progress.setInitialValue(startBlock)

    let sink: Sink
    if (options.out) {
        if (options.out.startsWith('postgres://')) {
            let db = new pg.Client({
                connectionString: options.out
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
                progress,
                batchSize: options.writeBatchSize
            })
        } else {
            let out = fs.createWriteStream(options.out, {flags: 'a'})
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

    every(5000, () => {
        if (!progress.hasNews()) return
        progress.tick()
        console.error(`last block: ${progress.getCurrentValue()}, processing: ${Math.round(progress.speed())} blocks/sec, writing: ${Math.round(writeSpeed.speed())} blocks/sec`)
    })

    let client = new Client(options.endpoint)

    let blocks = Ingest.getBlocks({
        client,
        typesBundle,
        startBlock
    })

    for await (let block of blocks) {
        await sink.write(block)
    }
})


async function getDbHeight(db: pg.ClientBase): Promise<number | undefined> {
    let res = await db.query("SELECT height FROM block ORDER BY height DESC LIMIT 1")
    if (res.rowCount) {
        return parseInt(res.rows[0].height)
    } else {
        return undefined
    }
}


function positiveInteger(s: string): number {
    let n = parseInt(s)
    assert(Number.isInteger(n) && n >= 0)
    return n
}


function every(ms: number, cb: () => void): void {
    setTimeout(() => {
        try {
            cb()
            every(ms, cb)
        } catch(e: any) {
            console.error(e)
            process.exit(1)
        }
    }, ms)
}

import {ResilientRpcClient} from "@subsquid/rpc-client/lib/resilient"
import {readOldTypesBundle} from "@subsquid/substrate-metadata"
import assert from "assert"
import {Command, InvalidOptionArgumentError} from "commander"
import * as fs from "fs"
import path from "path"
import * as pg from "pg"
import {migrate} from "postgres-migrations"
import {Ingest} from "./ingest"
import {PostgresSink, Sink, WritableSink} from "./sink"
import {ServiceManager} from "./util/sm"
import {ProgressTracker, SpeedTracker} from "./util/tracking"


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
            sink = new PostgresSink(db)
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
            sink = new WritableSink(out)
        }
    } else {
        sink = new WritableSink(process.stdout)
    }

    let blockProgress = new ProgressTracker()
    let writeSpeed = new SpeedTracker()
    let lastBlock = startBlock

    sm.every(5000, () => {
        blockProgress.tick()
        console.error(`last block: ${lastBlock}, processing: ${Math.round(blockProgress.speed())} blocks/sec, writing: ${Math.round(writeSpeed.speed())} blocks/sec`)
    })

    let blocks = Ingest.getBlocks({
        clients,
        typesBundle,
        startBlock
    })

    for await (let block of blocks) {
        sm.abort.assertNotAborted()
        writeSpeed.mark()
        await sink.write(block)
        let time = process.hrtime.bigint()
        writeSpeed.inc(1, time)
        blockProgress.inc(1, time)
        lastBlock = block.header.height
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


function urlOptionValidator(protocol?: string[]): (s: string) => string {
    return function (s) {
        let url
        try {
            url = new URL(s)
        } catch(e: any) {
            throw new InvalidOptionArgumentError('invalid url')
        }
        if (protocol && !protocol.includes(url.protocol)) {
            throw new InvalidOptionArgumentError(`invalid protocol, expected ${protocol.join(', ')}`)
        }
        return url.toString()
    }
}


function positiveInteger(s: string): number {
    let n = parseInt(s)
    assert(!isNaN(n) && n >= 0)
    return n
}

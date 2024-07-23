import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat} from '@subsquid/util-internal-commander'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {App} from './app'
import {PrometheusServer} from './prometheus'
import {EventEmitter} from 'events'


const LOG = createLogger('sqd:substrate-metadata-service')


export interface Options {
    port: number,
    name: string[]
    archive: string[]
    metrics?: number
}


runProgram(async () => {
    let program = new Command()

    program.description('Metadata service on top of substrate-dump(1) archive')
    program.option('-n, --name <name...>', 'network name', [])
    program.option('-a, --archive <url...>', 'archive url', collectArchives, [])
    program.option('-p, --port <number>', 'port number', nat, 3000)
    program.option('--metrics <port>', 'Enable prometheus metrics server', nat)

    let {name, archive, port, metrics} = program.parse().opts() as Options

    if (name.length != archive.length) throw new Error(
        `invalid options: number of archives (${archive.length}) doesn't match the number of network names (${name.length})`
    )

    let app = new App()
    let eventEmitter: EventEmitter | undefined
    if (metrics != null) {
        eventEmitter = new EventEmitter()
        let prometheus = new PrometheusServer(
            metrics ?? 0,
        )
        eventEmitter.on('S3FsOperation', (op: string) => prometheus.incS3Requests(op))
        let promServer = await prometheus.serve()
        LOG.info(`prometheus metrics are available on port ${promServer.port}`)
    }

    for (let i = 0; i < name.length; i++) {
        app.add(name[i], archive[i], eventEmitter)
    }

    let server = await app.listen(port)
    LOG.info(`listening on port ${server.port}`)

    await waitForInterruption(server)
}, err => LOG.fatal(err))


function collectArchives(url: string, prev: string[]): string[] {
    return prev.concat([FileOrUrl(['s3:'])(url)])
}

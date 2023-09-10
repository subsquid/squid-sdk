import {createLogger} from '@subsquid/logger'
import {runProgram} from '@subsquid/util-internal'
import {FileOrUrl, nat} from '@subsquid/util-internal-commander'
import {waitForInterruption} from '@subsquid/util-internal-http-server'
import {Command} from 'commander'
import {App} from './app'


const LOG = createLogger('sqd:substrate-metadata-service')


export interface Options {
    port: number,
    name: string[]
    archive: string[]
}


runProgram(async () => {
    let program = new Command()

    program.description('metadata service on top of raw substrate archive')
    program.option('-n, --name <name...>', 'network name', [])
    program.option('-a, --archive <url...>', 'archive url', collectArchives, [])
    program.option('-p, --port <number>', 'port number', nat, 3000)

    let {name, archive, port} = program.parse().opts() as Options

    if (name.length != archive.length) throw new Error(
        `invalid options: number of archives (${archive.length}) doesn't match the number of network names (${name.length})`
    )

    let app = new App()

    for (let i = 0; i < name.length; i++) {
        app.add(name[i], archive[i])
    }

    let server = await app.listen(port)
    LOG.info(`listening on port ${server.port}`)

    await waitForInterruption(server)
}, err => LOG.fatal(err))


function collectArchives(url: string, prev: string[]): string[] {
    return prev.concat([FileOrUrl(['s3:'])(url)])
}

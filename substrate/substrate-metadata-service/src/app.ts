import {waitDrain} from '@subsquid/util-internal'
import {createFs, Fs} from '@subsquid/util-internal-fs'
import {HttpApp, ListeningServer} from '@subsquid/util-internal-http-server'
import {EventEmitter} from 'events'
import {promisify} from 'util'
import {gunzip} from 'zlib'


export class App {
    private networks = new Map<string, Fs>

    add(network: string, archive: string, eventEmitter?: EventEmitter): void {
        let fs = createFs(archive, eventEmitter)
        this.networks.set(network, fs)
    }

    async listen(port: number): Promise<ListeningServer> {
        let http = new HttpApp()

        http.setSocketTimeout(60_000)

        http.add('/{network}', {
            GET: async ctx => {
                let network = ctx.params.network
                let archive = this.networks.get(network)
                if (archive == null) return ctx.send(404, `unknown network - ${network}`)

                let files = await listMetadataFiles(archive)
                if (files.length == 0) {
                    return ctx.send(404, `no metadata records found for network - ${network}`)
                }

                for (let {fileName, ...rec} of files) {
                    let gzippedMetadata = await archive.cd('metadata').readFile(fileName)
                    let metadata = await promisify(gunzip)(gzippedMetadata)
                    await waitDrain(ctx.response)
                    ctx.response.write(JSON.stringify({
                        ...rec,
                        metadata: '0x'+metadata.toString('hex')
                    }) + '\n')
                }
                ctx.response.end()
            }
        })

        return http.listen(port)
    }
}


interface MetadataFile {
    fileName: string
    blockNumber: number
    blockHash: string
    specName: string
    specVersion: number
}


async function listMetadataFiles(archive: Fs): Promise<MetadataFile[]> {
    let includedVersions = new Set<string>()

    let files: MetadataFile[] = []
    for (let name of await archive.ls('metadata')) {
        let m = /^(\d+)-([\da-f]+)--([\w\-]+)@(\d+)--([\w\.-]+)@(\d+)\.gz$/.exec(name)
        if (!m) continue
        let blockNumber = parseInt(m[1])
        let blockHash = '0x'+m[2]
        let specName = m[3]
        let specVersion = parseInt(m[4])
        let specId = specName + '@' + specVersion
        if (includedVersions.has(specId)) continue
        includedVersions.add(specId)
        files.push({
            fileName: name,
            blockNumber,
            blockHash,
            specName,
            specVersion
        })
    }

    return files.sort((a, b) => a.blockNumber - b.blockNumber)
}

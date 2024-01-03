import {createFs, Fs} from '@subsquid/util-internal-fs'
import {createHttpServer, ListeningServer} from '@subsquid/util-internal-http-server'
import express from 'express'
import {promisify} from 'util'
import {gunzip} from 'zlib'


export class App {
    private networks = new Map<string, Fs>

    add(network: string, archive: string): void {
        let fs = createFs(archive)
        this.networks.set(network, fs)
    }

    async listen(port: number): Promise<ListeningServer> {
        let app = express()

        app.get('/:network', (req, res, next) => this.getJsonLines(req, res).catch(next))

        return createHttpServer(app, port)
    }

    private async getJsonLines(
        req: express.Request<{network: string}>,
        res: express.Response
    ): Promise<void> {
        res.type('text')

        let network = req.params.network
        let archive = this.networks.get(network)
        if (archive == null) {
            res.status(404).end(`unknown network - ${network}`)
            return
        }

        let files = await listMetadataFiles(archive)
        if (files.length == 0) {
            res.status(404).end(`no metadata records found for network - ${network}`)
            return
        }

        for (let {fileName, ...rec} of files) {
            let gzippedMetadata = await archive.cd('metadata').readFile(fileName)
            let metadata = await promisify(gunzip)(gzippedMetadata)
            res.write(JSON.stringify({
                ...rec,
                metadata: '0x'+metadata.toString('hex')
            }) + '\n')
        }
        res.end()
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
        let m = /^(\d+)-([\da-f]+)--([\w\-]+)@(\d+)--([\w-]+)@(\d+)\.gz$/.exec(name)
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

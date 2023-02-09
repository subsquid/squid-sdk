import {createLogger} from '@subsquid/logger'
import {assertNotNull, def, runProgram} from '@subsquid/util-internal'
import {createNodeHttpServer, waitForInterruption} from '@subsquid/util-internal-http-server'
import express from 'express'
import * as fs from 'fs'
import * as process from 'process'
import {Client} from './client'


type Chain = string
type Endpoint = string
type Config = Record<Chain, Endpoint[]>


class App {
    private log = createLogger('sqd:chain-status-service')

    @def
    private config(): Config {
        let file = assertNotNull(process.argv[2], 'config file must be specified')
        let content = fs.readFileSync(file, 'utf-8')
        return JSON.parse(content)
    }

    @def
    private clients(): Record<Chain, Client> {
        let config = this.config()
        let clients: Record<Chain, Client> = {}
        for (let chain in config) {
            let endpoints = config[chain]
            if (endpoints.length > 0) {
                clients[chain] = new Client(endpoints, this.log.child({chain}))
            }
        }
        return clients
    }

    @def
    private app(): express.Application {
        let clients = this.clients()
        let app = express()

        app.get('/:chain', (req, res) => {
            let chain = req.params.chain
            let client = clients[chain]
            if (client == null) {
                res.type('text').status(404).send(`chain '${chain}' not found`)
                return
            }
            client.getStatus().then(
                status => {
                    res.send(status)
                },
                err => {
                    this.log.error({chain, err})
                    res.type('text').status(503).send('failed to fetch status from chain nodes')
                }
            )
        })

        app.set('json spaces', 2)

        return app
    }

    run(): void {
        runProgram(async () => {
            let server = await createNodeHttpServer(this.app(), 3000)
            this.log.info(`listening on port ${server.port}`)
            return waitForInterruption(server)
        }, err => this.log.fatal(err))
    }
}


new App().run()

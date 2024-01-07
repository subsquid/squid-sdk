import assert from 'assert'
import * as http from 'http'
import {RequestListener} from 'http'
import stoppable from 'stoppable'


export interface ListeningServer {
    readonly port: number
    close(): Promise<void>
}


export interface HttpServerOptions {
    port?: number | string
    socketTimeout?: number
}


export function createHttpServer(handler: RequestListener, options?: HttpServerOptions): Promise<ListeningServer> {
    let server = http.createServer(handler)
    if (options?.socketTimeout) {
        server.timeout = options.socketTimeout
    }
    return listen(server, options?.port)
}


export function listen(server: http.Server, port?: number | string): Promise<ListeningServer> {
    let s = stoppable(server, 5000)

    function close(): Promise<void> {
        return new Promise((resolve, reject) => {
            s.stop((err, gracefully) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    return new Promise<ListeningServer>((resolve, reject) => {
        s.listen(port || 0, (err?: Error) => {
            if (err) {
                reject(err)
            } else {
                let address = s.address()
                assert(address != null && typeof address == 'object')
                resolve({
                    port: address.port,
                    close
                })
            }
        })
    })
}


export function waitForInterruption(server: ListeningServer): Promise<void> {
    return new Promise((resolve, reject) => {
        function terminate() {
            process.off('SIGINT', terminate)
            process.off('SIGTERM', terminate)
            server.close().then(resolve, reject)
        }

        process.on('SIGINT', terminate)
        process.on('SIGTERM', terminate)
    })
}

import {def} from "@subsquid/util"
import {AbortError} from "./async"


export interface Service {
    close(): void | Promise<void | Error>
}


export class ServiceManager {
    private services: Service[] = []
    private stopped = false

    add<T extends Service>(s: T): T {
        if (this.stopped) throw new Error('Service manager is already stopped')
        this.services.push(s)
        return s
    }

    private async stop(): Promise<boolean> {
        let ok = true
        for (let i = this.services.length - 1; i >= 0; i--) {
            let err: Error | void
            try {
                let closeResult = this.services[i].close()
                if (closeResult) {
                    err = await closeResult
                }
            } catch(e: any) {
                err = e
            }
            if (!(err instanceof AbortError)) {
                ok = ok && !err
                if (err) console.error(err)
            }
        }
        return ok
    }

    private shutdown(err?: Error) {
        if (err) console.error(err)
        if (this.stopped) return
        this.stopped = true
        this.stop().then(ok => {
            ok = ok && !err
            process.exit(ok ? 0 : 1)
        })
    }

    static run(app: (sm: ServiceManager) => Promise<void>): void {
        let sm = new ServiceManager()
        app(sm).then(
            () => sm.shutdown(),
            err => sm.shutdown(err)
        )
    }
}



import {Abort, AbortHandle, isAbortError} from "@subsquid/util-internal"


export interface Service {
    close(): void | Promise<void | Error>
}


export class ServiceManager {
    private services: Service[] = []
    private stopped = false
    private _abort = new AbortHandle()

    add<T extends Service>(s: T): T {
        if (this.stopped) throw new Error('Service manager is already stopped')
        this.services.push(s)
        return s
    }

    get abort(): Abort {
        return this._abort
    }

    every(ms: number, fn: () => void): void {
        let timer: any

        this.add({
            close() {
                if (timer) clearTimeout(timer)
            }
        })

        let schedule = () => {
            if (this.stopped) return
            timer = setTimeout(() => {
                timer = undefined
                if (this.stopped) return
                try {
                    fn()
                } catch(e: any) {
                    this.shutdown(e)
                }
                schedule()
            }, ms)
        }

        schedule()
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
            if (!isAbortError(err)) {
                ok = ok && !err
                if (err) console.error(err)
            }
        }
        return ok
    }

    private shutdown(err?: Error) {
        if (err && !isAbortError(err)) console.error(err)
        if (this.stopped) return
        this.stopped = true
        this.stop().then(ok => {
            ok = ok && !err
            process.exit(ok ? 0 : 1)
        })
    }

    static run(app: (sm: ServiceManager) => Promise<void>): void {
        let sm = new ServiceManager()
        process.on('SIGINT', () => {
            sm._abort.abort()
        })
        process.on('SIGTERM', () => {
            sm._abort.abort()
        })
        try {
            app(sm).then(() => sm.shutdown(), err => sm.shutdown(err))
        } catch(err: any) {
            sm.shutdown(err)
        }
    }
}

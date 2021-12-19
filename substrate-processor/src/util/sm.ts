import {AbortError} from "./async"


export interface Service {
    stop(): Promise<Error | void>
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
        this.stopped = true
        let ok = true
        for (let i = this.services.length - 1; i >= 0; i--) {
            let err: Error | void
            try {
                err = await this.services[i].stop()
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

    shutdown(err?: Error) {
        if (err) console.error(err)
        this.stop().then(ok => {
            process.exit(ok && !err ? 0 : 1)
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



interface Tx<T> {
    close(): void
    ctx: T
}


export class LazyTransaction<T> {
    private closed = false

    private tx?: Promise<Tx<T>>

    constructor(private transact: (f: (ctx: T) => Promise<void>) => Promise<void>) {
    }

    async get(): Promise<T> {
        if (this.closed) {
            throw new Error("Too late to request transaction")
        }
        this.tx = this.tx || this.startTransaction()
        let {ctx} = await this.tx
        return ctx
    }

    private async startTransaction(): Promise<Tx<T>> {
        return new Promise((resolve, reject) => {
            let promise = this.transact(ctx => {
                return new Promise<void>(close => {
                    resolve({
                        ctx,
                        close: () => {
                            close()
                            return promise
                        }
                    })
                })
            })
            promise.catch(err => reject(err))
        })
    }

    async close(): Promise<void> {
        this.closed = true
        if (this.tx) {
            let tx = this.tx
            this.tx = undefined
            await tx.then(tx => tx.close())
        }
    }
}

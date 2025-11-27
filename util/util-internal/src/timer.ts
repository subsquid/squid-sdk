export class Timer {
    private timeout?: any

    constructor(private ms: number, private cb: () => void) {}

    start(): void {
        if (this.timeout != null) return
        this.timeout = setTimeout(() => {
            this.timeout = undefined
            this.cb()
        }, this.ms)
    }

    stop(): void {
        if (this.timeout == null) return
        clearTimeout(this.timeout)
        this.timeout = undefined
    }

    reset(): void {
        this.stop()
        this.start()
    }
}

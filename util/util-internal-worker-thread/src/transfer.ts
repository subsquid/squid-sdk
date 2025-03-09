import {MessagePort, TransferListItem} from 'worker_threads'


export class Transfer<T = any> {
    constructor(
        public value: T,
        public transferList: TransferListItem[]
    ) {}

    static map<T, R>(value: Transfer<T> | T, f: (val: T) => R): R | Transfer<R> {
        if (value instanceof Transfer) {
            return new Transfer(f(value.value), value.transferList)
        } else {
            return f(value)
        }
    }

    static value<T>(value: Transfer<T> | T): T {
        return value instanceof Transfer ? value.value : value
    }

    static send(port: MessagePort, value: unknown): void {
        if (value instanceof Transfer) {
            port.postMessage(value.value, value.transferList)
        } else {
            port.postMessage(value)
        }
    }
}

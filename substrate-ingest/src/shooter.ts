import {last, maybeLast} from "@subsquid/util-internal"


export class Shooter<K, V> {
    private records: {height: number, key: K}[] = []
    private current?: {height: number, key: K, value: V}

    constructor(
        private distance: number,
        private key: (height: number) => Promise<K>,
        private value: (key: K) => Promise<V>,
        private keyEquals: (a: K, b: K) => boolean,
        private maxHeight: () => number
    ) {
    }

    async get(height: number): Promise<V> {
        if (this.current == null) {
            let key = await this.key(height)
            let value = await this.value(key)
            this.current = {height, key, value}
            this.records.push({height, key})
            return value
        }

        while (this.records.length && last(this.records).height < height) {
            this.records.pop()
        }

        let rec = maybeLast(this.records)
        if (rec && this.keyEquals(rec.key, this.current.key)) {
            return this.current.value
        }

        let h = rec == null
            ? Math.min(height + this.distance, this.maxHeight())
            : height + Math.floor((rec.height - height)/2)

        while (rec == null || rec.height > height) {
            rec = {
                height: h,
                key: await this.key(h)
            }
            this.records.push(rec)
            if (this.keyEquals(rec.key, this.current.key)) return this.current.value
            h = height + Math.floor((h - height)/2)
        }

        let value = await this.value(rec.key)
        this.current = {...rec, value}
        return value
    }
}

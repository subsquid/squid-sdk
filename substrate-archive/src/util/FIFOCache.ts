export class FIFOCache<K, V> {
  private fifoStore: Array<V> = []
  private lookup: Map<K, V> = new Map<K, V>()
  private inverse: Map<V, K> = new Map<V, K>()

  constructor(public readonly capacity: number) {}

  put(k: K, v: V): void {
    if (this.fifoStore.length === this.capacity) {
      const lru = this.fifoStore.shift() as V
      const key = this.inverse.get(lru) as K
      this.inverse.delete(lru)
      this.lookup.delete(key)
    }

    this.fifoStore.push(v)
    this.lookup.set(k, v)
    this.inverse.set(v, k)
  }

  get(k: K): V | undefined {
    return this.lookup.get(k)
  }

  firstKey(): K | undefined {
    if (this.fifoStore.length === 0) {
      return undefined
    }
    return this.inverse.get(this.fifoStore[0])
  }

  getKey(v: V): K | undefined {
    return this.inverse.get(v)
  }

  size(): number {
    return this.fifoStore.length
  }
}

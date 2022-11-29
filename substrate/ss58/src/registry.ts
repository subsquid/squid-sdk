
export interface Item {
    /**
     * The address prefix (ss58 address type).
     *
     * Must be unique across registry.
     */
    readonly prefix: number
    /**
     * Unique identifier for the network that will use this prefix
     *
     * No spaces allowed.
     */
    readonly network: string
    /**
     * The name of the network that will use this prefix, in a format friendly for display.
     */
    readonly displayName: string
    /**
     * Array of symbols of any tokens the chain uses, usually 2-5 characters.
     *
     * Most chains will only have one.
     * Chains that have multiple instances of the Balances pallet should order the array by instance.
     */
    readonly symbols: ReadonlyArray<string>
    /**
     * Array of integers representing the number of decimals that represent a single unit to the end user.
     *
     * Must be same length as `symbols` to represent each token's denomination.
     */
    readonly decimals: ReadonlyArray<number>
    /**
     * Signing curve for standard account.
     *
     * Substrate supports ed25519, sr25519, and secp256k1.
     */
    readonly standardAccount?: string | null
    /**
     * A website or GitHub repo associated with the network.
     */
    readonly website?: string | null
}


export class Registry {
    public readonly items: ReadonlyArray<Item>
    private byPrefix = new Map<number, Item>()
    private byNetwork = new Map<string, Item>()

    constructor(items: Item[]) {
        this.items = items.slice()
        this.items.forEach(item => {
            if (this.byPrefix.has(item.prefix)) {
                throw new Error(`Duplicate prefix ${item.prefix}`)
            } else {
                this.byPrefix.set(item.prefix, item)
            }
            if (this.byNetwork.has(item.network)) {
                throw new Error(`Duplicate network ${item.network}`)
            } else {
                this.byNetwork.set(item.network, item)
            }
        })
    }

    get(networkOrPrefix: string | number): Item {
        if (typeof networkOrPrefix == 'string') {
            let item = this.byNetwork.get(networkOrPrefix)
            if (item == null) throw new Error(`No entry for network ${networkOrPrefix}`)
            return item
        } else {
            let item = this.byPrefix.get(networkOrPrefix)
            if (item == null) throw new Error(`No entry for prefix ${networkOrPrefix}`)
            return item
        }
    }

    find(networkOrPrefix: string | number): Item | undefined {
        if (typeof networkOrPrefix == 'string') {
            return this.byNetwork.get(networkOrPrefix)
        } else {
            return this.byPrefix.get(networkOrPrefix)
        }
    }
}

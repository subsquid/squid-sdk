import {Rpc} from '@subsquid/substrate-data-raw'
import {Bytes, Runtime} from '@subsquid/substrate-runtime'
import {getNameHash} from '@subsquid/substrate-runtime/lib/runtime/storage'
import {parseQualifiedName} from '@subsquid/substrate-runtime/lib/runtime/util'
import {array, bytes, GetType, numeric, Type} from '@subsquid/substrate-runtime/lib/sts'
import {assertNotNull, def} from '@subsquid/util-internal'
import {RawBlock} from './interfaces/data-raw'
import {assertStorage} from './types/util'


class ScalarStorage<T extends Type> {
    constructor(private name: string, private type: T) {}

    assert(runtime: Runtime | RawBlock): void {
        assertStorage(getRuntime(runtime), this.name, ['Default', 'Required'], [], this.type)
    }

    check(runtime: Runtime | RawBlock): boolean {
        return getRuntime(runtime).checkStorageType(this.name, ['Default', 'Required'], [], this.type)
    }

    isDefined(runtime: Runtime | RawBlock): boolean {
        return getRuntime(runtime).hasStorageItem(this.name)
    }

    @def
    key(): Bytes {
        let [pallet, name] = parseQualifiedName(this.name)
        return getNameHash(pallet) + getNameHash(name).slice(2)
    }

    async get(rpc: Rpc, block: RawBlock): Promise<GetType<T> | undefined> {
        this.assert(block)
        let value = await rpc.getStorage(this.key(), block.hash)
        if (value === undefined) return
        return this.decode(block, value)
    }

    decode(runtime: RawBlock | Runtime, value: Bytes | null): GetType<T> {
        this.assert(runtime)
        return getRuntime(runtime).decodeStorageValue(this.name, value)
    }
}


function getRuntime(blockOrRuntime: RawBlock | Runtime): Runtime {
    if (blockOrRuntime instanceof Runtime) return blockOrRuntime
    return assertNotNull(blockOrRuntime.runtime)
}


export const STORAGE = {
    nextFeeMultiplier: new ScalarStorage('TransactionPayment.NextFeeMultiplier', numeric()),
    sessionIndex: new ScalarStorage('Session.CurrentIndex', numeric()),
    validators: new ScalarStorage('Session.Validators', array(bytes()))
}

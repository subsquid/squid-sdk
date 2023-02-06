import {Ti, TypeKind} from '@subsquid/scale-codec'
import {ChainDescription, OldTypes, Type, Variant} from '@subsquid/substrate-metadata'
import {getGlobalVariants, getVariantHash} from '@subsquid/substrate-metadata/lib/events-and-calls.js'
import {OldTypeRegistry} from '@subsquid/substrate-metadata/lib/old/typeRegistry.js'
import type {Output} from '@subsquid/util-internal-code-printer'
import assert from 'assert'


/**
 * Event or Call
 */
export interface GlobalEnum {
    __kind: string
    value: {__kind: string}
}


export function toGlobalEnum(flat: {__kind: string}): GlobalEnum {
    let [pallet, name] = flat.__kind.split('.')
    return {
        __kind: pallet,
        value: {
            ...flat,
            __kind: name
        }
    }
}


export class TypeDefinitions {
    private types: Type[]
    private event: Record<string, Variant> = {}
    private call: Record<string, Variant> = {}

    constructor(definitions: OldTypes) {
        let registry = new OldTypeRegistry(definitions)
        for (let name in definitions.types) {
            registry.use(name)
        }
        this.types = registry.getTypes()
        // collect events and calls
        this.types.forEach(type => {
            let typeName = type.path?.[0]?.toLowerCase()
            if (typeName == 'event' || typeName == 'call') {
                assert(type.kind == TypeKind.Variant)
                for (let variant of type.variants) {
                    this[typeName][variant.name] = variant
                }
            }
        })
    }

    checkChainDescription(d: ChainDescription): void {
        this.checkGlobalEnum('event', d)
        this.checkGlobalEnum('call', d)
    }

    private checkGlobalEnum(kind: 'event' | 'call', d: ChainDescription): void {
        let variants = new Map()
        for (let v of getGlobalVariants(d.types, d[kind])) {
            variants.set(`${v.pallet}.${v.name}`, v)
        }
        for (let [name, def] of Object.entries(this[kind])) {
            let v = variants.get(name)
            if (v == null) throw new Error(
                `${kind} ${name} is absent in the chain runtime`
            )
            if (getVariantHash(d.types, v) != getVariantHash(this.types, def)) throw new Error(
                `chain runtime has unexpected type of ${name} ${kind}`
            )
        }
    }

    flatten(kind: 'event' | 'call', value: GlobalEnum): any {
        let v: {__kind: string, __name?: string} = value.value
        let name = `${value.__kind}.${v.__kind}`
        if (this[kind][name]) {
            v.__kind = name
        } else {
            v.__kind = 'Fallback'
            v.__name = name
        }
        return v
    }

    async generateInterfaces(out: Output): Promise<void> {
        let {Interfaces} = await import('@subsquid/substrate-typegen/lib/ifs.js')

        // add Fallback case to Event and Call variants
        let types = this.types.map(type => {
            let name = type.path?.[0]
            switch(name) {
                case 'Event':
                case 'Call': {
                    assert(type.kind == TypeKind.Variant)
                    let variants = type.variants.slice()
                    variants.push({
                        name: 'Fallback',
                        index: variants.reduce((idx, v) => Math.max(idx, v.index), 0) + 1,
                        fields: []
                    })
                    return {
                        ...type,
                        variants
                    }
                }
                default:
                    return type
            }
        })

        let ifs = new Interfaces(types, this.getNameAssignment())
        for (let ti = 0; ti < types.length; ti++) {
            ifs.use(ti)
        }
        ifs.generate(out)
    }

    private getNameAssignment(): Map<Ti, string> {
        let nameAssignment = new Map<number, string>()
        this.types.forEach((type, ti) => {
            let name = type.path?.[0]
            if (name) {
                nameAssignment.set(ti, name)
            }
        })
        return nameAssignment
    }
}


export const definitions = new TypeDefinitions({
    types: {
        AccountId: '[u8; 32]',
        DockerDigest: '[u8; 32]',
        DockerImage: {
            name: 'Vec<u8>',
            digest: 'DockerDigest'
        },
        TaskId: 'u64',
        WorkerId: 'AccountId',
        WorkerInfo: {
            spec: 'HardwareSpec',
            is_online: 'bool',
        },
        TaskSpec: {
            docker_image: 'DockerImage',
            command: 'Vec<Vec<u8>>'
        },
        TaskResult: {
            exit_code: 'u32',
            stdout: 'Vec<u8>',
            stderr: 'Vec<u8>'
        },
        HardwareSpec: {
            num_cpu_cores: 'Option<u16>',
            memory_bytes: 'Option<u64>',
            storage_bytes: 'Option<u64>',
        },
        Event: {
            _enum: {
                'Worker.RunTask': {
                    worker_id: 'WorkerId',
                    task_id: 'TaskId',
                    task_spec: 'TaskSpec',
                    constraints: 'Option<HardwareSpec>'
                }
            }
        },
        Call: {
            _enum: {
                'Worker.register': {
                    spec: 'HardwareSpec',
                    is_online: 'bool',
                },
                'Worker.unregister': {},
                'Worker.update_spec': {
                    spec: 'HardwareSpec',
                },
                'Worker.go_online': {},
                'Worker.go_offline': {},
                'Worker.done': {
                    task_id: 'TaskId',
                    task_result: 'TaskResult'
                }
            }
        }
    }
})

import {Ti} from '@subsquid/scale-codec'
import {ChainDescription, OldTypes, Type} from '@subsquid/substrate-metadata'
import {OldTypeRegistry} from '@subsquid/substrate-metadata/lib/old/typeRegistry'
import {assertNotNull, runProgram} from '@subsquid/util-internal'
import type {Output} from '@subsquid/util-internal-code-printer'


export class TypeDefinitions {
    private mapping: Record<string, Ti> = {}
    private types: Type[]

    constructor(definitions: OldTypes) {
        let registry = new OldTypeRegistry(definitions)
        for (let name in definitions.types) {
            this.mapping[name] = registry.use(name)
        }
        this.types = registry.getTypes()
    }

    check(d: ChainDescription): void {

    }

    private getType(name: string): Ti {
        return assertNotNull(this.mapping[name])
    }

    getNameAssignment(): Map<Ti, string> {
        let nameAssignment = new Map<number, string>()
        this.types.forEach((type, ti) => {
            let name = type.path?.[0]
            if (name) {
                nameAssignment.set(ti, name)
            }
        })
        return nameAssignment
    }

    async generateInterfaces(out: Output): Promise<void> {
        let {Interfaces} = await import('@subsquid/substrate-typegen/lib/ifs')
        let ifs = new Interfaces(this.types, this.getNameAssignment())
        for (let type of Object.values(this.mapping)) {
            ifs.use(type)
        }
        ifs.generate(out)
    }
}


export const definitions = new TypeDefinitions({
    types: {
        H256: '[u8; 32]',
        WorkerId: 'H256',
        RequestId: 'H256',
        Task: {
            request_id: 'RequestId',
            docker_image: 'H256',
            command: 'Vec<Vec<u8>>'
        },
        Event: {
            _enum: {
                Fallback: 'Null',
                Worker: 'WorkerEvent'
            }
        },
        WorkerEvent: {
            _enum: {
                Fallback: 'Null',
                RunTask: {
                    worker_id: 'WorkerId',
                    task: 'Task'
                }
            }
        }
    }
})


if (require.main === module) {
    runProgram(async () => {
        let {OutDir} = await import('@subsquid/util-internal-code-printer')
        let out = new OutDir(__dirname).file('../../src/chain/interface.ts')
        await definitions.generateInterfaces(out)
        out.write()
    })
}

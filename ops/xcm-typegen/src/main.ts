import * as definitions from '@subsquid/substrate-runtime/lib/metadata/old/definitions/xcm'
import {OldTypeRegistry} from '@subsquid/substrate-runtime/lib/metadata/old/typeRegistry'
import {Sts} from '@subsquid/substrate-typegen/lib/ifs'
import {runProgram} from '@subsquid/util-internal'
import {OutDir} from '@subsquid/util-internal-code-printer'


runProgram(async () => {
    let registry = new OldTypeRegistry(definitions)
    let xcmTypes: Set<number> = new Set()

    for (let key in definitions.types) {
        xcmTypes.add(registry.use(key))
    }

    let types = registry.getTypes()

    let nameAssignment = new Map<number, string>()
    types.forEach((type, ti) => {
        let name = type.path?.[0]
        if (name) {
            nameAssignment.set(ti, name)
        }
    })

    let out = new OutDir(__dirname).file('../../../substrate/substrate-runtime/src/xcm/interfaces.ts')
    out.line(`import {Bytes} from '../metadata'`)
    out.line(`import * as sts from '../sts'`)

    let ifs = new Sts(types, nameAssignment)
    for (let type of xcmTypes) {
        ifs.useType(type)
    }
    ifs.sink.generate(out)
    out.write()
})

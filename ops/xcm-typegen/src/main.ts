import * as definitions from "@subsquid/substrate-metadata/lib/old/definitions/xcm"
import {OldTypeRegistry} from "@subsquid/substrate-metadata/lib/old/typeRegistry"
import {Interfaces} from "@subsquid/substrate-typegen/lib/ifs"
import {runProgram} from "@subsquid/util-internal"
import {OutDir} from "@subsquid/util-internal-code-printer"


runProgram(async () => {
    let registry = new OldTypeRegistry(definitions)
    let versionXcm = registry.use('VersionedXcm')
    let types = registry.getTypes()

    let nameAssignment = new Map<number, string>()
    types.forEach((type, ti) => {
        let name = type.path?.[0]
        if (name) {
            nameAssignment.set(ti, name)
        }
    })

    let out = new OutDir(__dirname).file('../../../substrate-metadata/src/xcm/interfaces.ts')
    let ifs = new Interfaces(types, nameAssignment)
    ifs.use(versionXcm)
    ifs.generate(out)
    out.write()
})

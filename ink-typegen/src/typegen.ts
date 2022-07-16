import {AbiDescription} from "@subsquid/ink-abi/lib/abi-description"
import {InkProject} from "@subsquid/ink-abi/lib/metadata/interfaces"
import {getInkProject} from "@subsquid/ink-abi/lib/metadata/validator"
import {Interfaces} from "@subsquid/substrate-typegen/lib/ifs"
import {deriveName, distributeNames, needsName} from "@subsquid/substrate-typegen/lib/names"
import {def} from "@subsquid/util-internal"
import {Output} from "@subsquid/util-internal-code-printer"
import fs from "fs"


type Ti = number


export class Typegen {
    constructor(
        private abiFile: string,
        private out: Output
    ) { }

    @def
    metadata(): unknown {
        let content = fs.readFileSync(this.abiFile, 'utf-8')
        try {
            return JSON.parse(content)
        } catch(e: any) {
            throw new Error(`Failed to parse ${this.abiFile}: ${e.message}`)
        }
    }

    @def
    project(): InkProject {
        try {
            return getInkProject(this.metadata())
        } catch(e: any) {
            throw new Error(`Invalid ${this.abiFile}: ${e.message}`)
        }
    }

    @def
    description(): AbiDescription {
        return new AbiDescription(this.project())
    }

    @def
    nameAssignment(): Map<Ti, string> {
        let d = this.description()
        let assignment = new Map()
        let reserved = new Set<string>()

        reserved.add('Result')
        reserved.add('metadata')

        function assign(ti: Ti, name: string): void {
            assignment.set(ti, name)
            reserved.add(name)
        }

        assign(d.event(), 'Event')
        assign(d.messages(), 'Message')
        assign(d.constructors(), 'Constructor')

        let names = new Map<string, Ti[]>()
        let types = d.types()

        types.forEach((type, ti) => {
            if (assignment.has(ti)) return
            let name = deriveName(type)
            if (name && reserved.has(name)) {
                name = undefined
            }
            if (name == null && needsName(types, ti)) {
                name = `Type_${ti}`
            }
            if (name) {
                let list = names.get(name)
                if (list == null) {
                    list = []
                    names.set(name, list)
                }
                list.push(ti)
            }
        })

        distributeNames(types, names.entries(), assignment)

        return assignment
    }

    @def
    generate(): void {
        let d = this.description()
        let ifs = new Interfaces(d.types(), this.nameAssignment())

        this.out.line(`import {Abi} from "@subsquid/ink-abi"`)

        this.out.line()
        this.out.line(`export const metadata = ${JSON.stringify(this.metadata(), null, 2)}`)

        this.out.line()
        this.out.line(`const _abi = new Abi(metadata)`)

        this.out.line()
        this.out.block(`export function decodeEvent(hex: string): ${ifs.use(d.event())}`, () => {
            this.out.line(`return _abi.decodeEvent(hex)`)
        })

        this.out.line()
        this.out.block(`export function decodeMessage(hex: string): ${ifs.use(d.messages())}`, () => {
            this.out.line(`return _abi.decodeMessage(hex)`)
        })

        this.out.line()
        this.out.block(`export function decodeConstructor(hex: string): ${ifs.use(d.constructors())}`, () => {
            this.out.line(`return _abi.decodeConstructor(hex)`)
        })

        ifs.generate(this.out)

        this.out.line()
        // language=TypeScript
        this.out.line(`export type Result<T, E> = {__kind: 'Ok', value: T} | {__kind: 'Err', value: E}`)
    }
}

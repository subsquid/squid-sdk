import {AbiDescription} from "@subsquid/ink-abi/lib/abi-description"
import {TypeSpecFor_PortableForm} from "@subsquid/ink-abi/lib/metadata/v3/interfaces"
import {getInkProject, InkProject} from "@subsquid/ink-abi/lib/metadata/validator"
import {Interfaces} from "@subsquid/substrate-typegen/lib/ifs"
import {Names} from "@subsquid/substrate-typegen/lib/names"
import {def, last} from "@subsquid/util-internal"
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
        let names = new Names(d.types())

        names.reserve('metadata')
        names.assign(d.event(), 'Event')
        names.assign(d.messages(), 'Message')
        names.assign(d.constructors(), 'Constructor')

        function addArgAlias({type}: {type: TypeSpecFor_PortableForm}): void {
            if (type.displayName?.length) {
                names.alias(type.type, last(type.displayName))
            }
        }

        this.project().spec.events.forEach(e => {
            e.args.forEach(addArgAlias)
        })

        this.project().spec.messages.forEach(m => {
            m.args.forEach(addArgAlias)
        })

        this.project().spec.constructors.forEach(c => {
            c.args.forEach(addArgAlias)
        })

        return names.getAssignment()
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

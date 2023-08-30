import {AbiDescription} from "@subsquid/ink-abi/lib/abi-description"
import {TypeSpecFor_PortableForm} from "@subsquid/ink-abi/lib/metadata/v3/interfaces"
import {getInkProject, InkProject} from "@subsquid/ink-abi/lib/metadata/validator"
import {Interfaces} from "@subsquid/substrate-typegen/lib/ifs"
import {Names} from "@subsquid/substrate-typegen/lib/names"
import {assertNotNull, def, last} from "@subsquid/util-internal"
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

        this.out.line(`import {Abi, Bytes, encodeCall, decodeResult} from "@subsquid/ink-abi"`)

        this.out.line()
        this.out.line(`export const metadata = ${JSON.stringify(this.metadata(), null, 2)}`)

        this.out.line()
        this.out.line(`const _abi = new Abi(metadata)`)

        this.out.line()
        this.out.block(`export function decodeEvent(bytes: Bytes): ${ifs.use(d.event())}`, () => {
            this.out.line(`return _abi.decodeEvent(bytes)`)
        })

        this.out.line()
        this.out.block(`export function decodeMessage(bytes: Bytes): ${ifs.use(d.messages())}`, () => {
            this.out.line(`return _abi.decodeMessage(bytes)`)
        })

        this.out.line()
        this.out.block(`export function decodeConstructor(bytes: Bytes): ${ifs.use(d.constructors())}`, () => {
            this.out.line(`return _abi.decodeConstructor(bytes)`)
        })

        this.out.line()
        this.out.block('export interface Chain', () => {
            this.out.block('rpc:', () => {
                this.out.line('call<T=any>(method: string, params?: unknown[]): Promise<T>')
            })
        })

        this.out.line()
        this.out.block('export interface ChainContext', () => {
            this.out.line('_chain: Chain')
        })

        this.out.line()
        this.out.block('export class Contract', () => {
            this.out.line('constructor(private ctx: ChainContext, private address: Bytes, private blockHash?: Bytes) { }')

            this.project().spec.messages.forEach(m => {
                if (!m.mutates) {
                    let args = m.args.map(arg => `${arg.label}: ${ifs.use(arg.type.type)}`).join(', ')
                    let returnType = assertNotNull(m.returnType?.type)
                    let callArgs = m.args.map(arg => arg.label).join(', ')
                    this.out.line()
                    this.out.block(`${m.label.replace('::', '_')}(${args}): Promise<${ifs.use(returnType)}>`, () => {
                        this.out.line(`return this.stateCall('${m.selector}', [${callArgs}])`)
                    })
                }
            })

            this.out.line()
            this.out.block('private async stateCall<T>(selector: string, args: any[]): Promise<T>', () => {
                this.out.line('let input = _abi.encodeMessageInput(selector, args)')
                this.out.line('let data = encodeCall(this.address, input)')
                this.out.line("let result = await this.ctx._chain.rpc.call('state_call', ['ContractsApi_call', data, this.blockHash])")
                this.out.line('let value = decodeResult(result)')
                this.out.line('return _abi.decodeMessageOutput(selector, value)')
            })
        })

        ifs.generate(this.out)

        this.out.line()
        // language=TypeScript
        this.out.line(`export type Result<T, E> = {__kind: 'Ok', value: T} | {__kind: 'Err', value: E}`)
    }
}

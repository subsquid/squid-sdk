import fs from "fs";
import {Output} from "@subsquid/util-internal-code-printer"
import {Abi} from "@subsquid/contracts-metadata"
import {Interfaces} from "@subsquid/substrate-typegen/lib/ifs"


export class Typegen {
    constructor(private metadata: string, private output: string) { }

    generate(): void {
        let content: string
        try {
            content = fs.readFileSync(this.metadata, 'utf-8')
        } catch (e) {
            throw new Error(`Failed to read ${this.metadata}: ${e}`)
        }

        let metadata: Record<string, any>
        try {
            metadata = JSON.parse(content)
        } catch (e) {
            throw new Error(`Failed to parse ${this.metadata}: ${e}`)
        }

        let abi = new Abi(metadata)
        let nameAssignment = new Map()
        let ifs = new Interfaces(abi.types, nameAssignment)

        let output = new Output()

        output.line("import assert from 'assert'")
        output.line("import {Abi, DecodedEvent} from '@subsquid/contracts-metadata'")
        output.line()
        output.line()

        output.line("const abi = new Abi(getMetadata())")
        output.line()
        output.line()

        output.block('export interface ContractEmittedEvent', () => {
            output.line("name: 'Contracts.ContractEmitted'")
            output.block("args:", () => {
                output.line("contract: string")
                output.line("data: string")
            })
        })
        output.line()
        output.line()

        abi.events.forEach(event => {
            let eventName = `${event.label}Event`
            output.blockComment(event.docs)
            output.block(`export interface ${eventName}`, () => {
                event.args.forEach(arg => {
                    let type = ifs.use(arg.type)
                    output.blockComment(arg.docs)
                    output.line(`${arg.label}: ${type}`)
                })
            })
            output.line()
            output.line()
        })

        output.block('export class ContractEvent', () => {
            output.line('private readonly decoded: DecodedEvent')
            output.block('constructor(event: ContractEmittedEvent)', () => {
                output.line('this.decoded = abi.decodeEvent(event.args.data)')
            })
            abi.events.forEach(event => {
                let eventName = `${event.label}Event`
                output.line()
                output.block(`get is${eventName}()`, () => {
                    output.line(`return this.decoded.event.label == '${event.label}'`)
                })

                output.line()
                output.block(`get${eventName}(): ${eventName}`, () => {
                    output.line(`assert(this.is${eventName})`)
                    output.block('return', () => {
                        event.args.forEach((arg, index) => {
                            output.line(`${arg.label}: this.decoded.args[${index}],`)
                        })
                    })
                })
            })
        })

        output.line()
        output.line()
        output.block("function getMetadata()", () => {
            `return ${JSON.stringify(metadata, null, 2)}`.split('\n').forEach(line => {
                output.line(line)
            });
        });

        fs.writeFileSync(this.output, output.toString());
    }
}

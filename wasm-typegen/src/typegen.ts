import {Output} from "@subsquid/util-internal-code-printer"
import {Abi, AbiEvent, AbiParam} from "@subsquid/wasm-decoder"
import {Interfaces} from "@subsquid/substrate-typegen/lib/ifs"
import fs from "fs";


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

        output.line("import {Abi} from '@subsquid/wasm-decoder'")
        output.line()
        output.line()

        output.line("let abi = new Abi(getMetadata())")
        output.line()
        output.line()

        let contractEmittedEvent = 'ContractEmittedEvent'
        output.block(`export interface ${contractEmittedEvent}`, () => {
            output.line("name: 'Contracts.ContractEmitted'")
            output.block("args:", () => {
                output.line("contract: string")
                output.line("data: string")
            })
        })

        metadata.V3.spec.events.forEach((event: AbiEvent) => {
            output.line()
            output.line()

            let eventName = `${event.label}Event`
            output.block(`export interface ${eventName}`, () => {
                event.args.forEach((arg: AbiParam) => {
                    let type = ifs.use(arg.type.type)
                    output.line(`${arg.label}: ${type}`)
                })
            })
            output.line()
            output.line()
            output.block(`export function decode${eventName}(event: ${contractEmittedEvent}): ${eventName}`, () => {
                output.line("let decoded = abi.decodeEvent(event.args.data)")
                output.block("return", () => {
                    event.args.forEach((arg: AbiParam, index) => {
                        output.line(`${arg.label}: decoded.args[${index}],`)
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

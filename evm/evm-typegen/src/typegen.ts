import { Logger } from "@subsquid/logger";
import { def } from "@subsquid/util-internal";
import { keccak256 } from "@subsquid/evm-codec";
import { getType } from "./util/types";
import type { Abi, AbiEvent, AbiFunction, AbiParameter } from "abitype";
import { PrettyFileOutput, PrettyOutDir } from "./pretty-out-dir";

export class Typegen {
  private out: PrettyFileOutput;

  constructor(
    dest: PrettyOutDir,
    private abi: Abi,
    basename: string,
    private log: Logger,
  ) {
    this.out = dest.file(basename + ".ts");
  }

  async generate() {
    this.out.line(`import * as p from "@subsquid/evm-codec";`);
    this.out.line(
      "const { event, fun, indexed, struct, array, fixedArray, ContractBase } = p;",
    );
    this.out.line();

    this.generateEvents();
    this.generateFunctions();
    this.generateContract();

    await this.out.write();
    this.log.info(`saved ${this.out.file}`);
  }

  private generateEvents() {
    let events = this.getEvents();
    if (events.length == 0) {
      return;
    }
    this.out.line();
    this.out.block(`export const events =`, () => {
      for (let e of events) {
        this.out.line(
          `${this.getPropName(e)}: event("${this.topic0(e)}", {${this.toTypes(
            e.inputs,
          )}}),`,
        );
      }
    });
  }

  private topic0(e: AbiEvent): string {
    return `0x${keccak256(this.sighash(e)).toString("hex")}`;
  }

  private toTypes(inputs: readonly AbiParameter[]): string {
    return inputs.map((input, idx) => getType(input, idx)).join(", ");
  }

  private generateFunctions() {
    let functions = this.getFunctions();
    if (functions.length == 0) {
      return;
    }
    this.out.line();
    this.out.block(`export const functions =`, () => {
      for (let f of functions) {
        let returnType = "";
        if (f.outputs?.length === 1) {
          returnType = getType({ ...f.outputs[0], name: undefined });
        }

        this.out.line(
          `${this.getPropName(f)}: fun("${this.functionSelector(
            f,
          )}", {${this.toTypes(f.inputs)}},${returnType}),`,
        );
      }
    });
  }

  private functionSelector(f: AbiFunction): string {
    const sighash = this.sighash(f);
    return `0x${keccak256(sighash).slice(0, 4).toString("hex")}`;
  }

  private generateContract() {
    this.out.line();
    this.out.block(`export class Contract extends ContractBase`, () => {
      let functions = this.getFunctions();
      for (let f of functions) {
        if (
          (f.stateMutability === "pure" || f.stateMutability === "view") &&
          f.outputs?.length
        ) {
          this.out.line();
          let argNames = f.inputs.map((a, idx) => a.name || `arg${idx}`);
          const ref = this.getRef(f);
          let args = f.inputs
            .map(
              (a, idx) =>
                `${argNames[idx]}: Parameters<typeof functions${ref}["encode"]>[${idx}]`,
            )
            .join(", ");
          this.out.block(`${this.getPropName(f)}(${args})`, () => {
            this.out.line(
              `return this.eth_call(functions${ref}, [${argNames.join(", ")}])`,
            );
          });
        }
      }
    });
  }

  private getRef(item: AbiEvent | AbiFunction): string {
    let key = this.getPropName(item);
    if (key[0] == "'") {
      return `[${key}]`;
    } else {
      return "." + key;
    }
  }

  private cannonicalType(param: AbiParameter): string {
    if (!param.type.startsWith("tuple")) {
      return param.type;
    }
    const arrayBrackets = param.type.slice(5);
    return `(${(param as any).components.map((param: AbiParameter) =>
      this.cannonicalType(param),
    )})${arrayBrackets}`;
  }

  private sighash(item: AbiEvent | AbiFunction): string {
    return `${item.name}(${item.inputs
      .map((param) => this.cannonicalType(param))
      .join(",")})`;
  }

  private getPropName(item: AbiEvent | AbiFunction): string {
    if (this.getOverloads(item) == 1) {
      return item.name;
    } else {
      return `"${this.sighash(item)}"`;
    }
  }

  private getOverloads(item: AbiEvent | AbiFunction): number {
    if (item.type === "event") {
      return this.eventOverloads()[item.name];
    } else {
      return this.functionOverloads()[item.name];
    }
  }

  @def
  private functionOverloads(): Record<string, number> {
    let overloads: Record<string, number> = {};
    for (let item of this.getFunctions()) {
      overloads[item.name] = (overloads[item.name] || 0) + 1;
    }
    return overloads;
  }

  @def
  private eventOverloads(): Record<string, number> {
    let overloads: Record<string, number> = {};
    for (let item of this.getEvents()) {
      overloads[item.name] = (overloads[item.name] || 0) + 1;
    }
    return overloads;
  }

  @def
  private getFunctions(): AbiFunction[] {
    return this.abi.filter((f) => f.type === "function") as AbiFunction[];
  }

  @def
  private getEvents(): AbiEvent[] {
    return this.abi.filter((f) => f.type === "event") as AbiEvent[];
  }
}

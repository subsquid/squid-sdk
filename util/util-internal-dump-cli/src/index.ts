import {Command, Option} from 'commander'

export {getShortHash, formatBlockNumber} from '@subsquid/util-internal-archive-layout'
export {Fs} from '@subsquid/util-internal-fs'
export * from '@subsquid/util-internal-commander'
export * from '@subsquid/util-internal-range'
export * from './dumper'
export {Command, Option}


export function removeOption(command: Command, name: string): void {
    let mc = command as unknown as {options: Option[]}
    mc.options = mc.options.filter(o => o.attributeName() !== name)
}

import {runProgram} from '@subsquid/util-internal'
import {program} from 'commander'
import * as process from 'process'
import {ConfigNotFound, getConfig, InvalidConfig} from './config'
import {run, UndefinedCommand} from './run'


runProgram(async () => {
    program
        .description(`
Command runner for squids. Serves as a replacement for Makefiles and npm scripts.

The tool is driven by a commands.json config file, expected at the project root.
        `.trim())
        .name('squid-commands')
        .argument('[commands...]', 'commands to execute')

    program.parse()

    let commands: string[] = program.processedArgs[0] ?? []
    if (commands.length == 0) {
        await printAvailableCommands()
        process.exit(1)
    }

    let config = await getConfig()
    let exitCode = await run(config, commands)
    process.exit(exitCode)

}, err => {
    if (err instanceof InvalidConfig || err instanceof UndefinedCommand || err instanceof ConfigNotFound) {
        console.error(err.toString())
    } else {
        console.error(err)
    }
})


async function printAvailableCommands(): Promise<void> {
    let config = await getConfig()
    let all = Object.entries(config.commands || {})
    let visible = all.filter(e => e[1].hidden !== false)
    if (visible.length == 0) {
        console.log(`${config.file} defines no ${all.length > 0 ? 'visible commands' : 'commands'}`)
        return
    }
    let pad = visible.reduce((max, e) => Math.max(max, e[0].length), 0)
    console.log()
    console.log('Available commands:')
    console.log()
    for (let [name, cmd] of visible) {
        console.log(`  ${name.padEnd(pad, ' ')}  ${cmd.description || ''}`)
    }
    console.log()
}

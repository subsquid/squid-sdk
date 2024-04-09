import {createLogger} from '@subsquid/logger'
import {assertNotNull} from '@subsquid/util-internal'
import {spawn} from 'child_process'
import {glob} from 'glob'
import * as Path from 'path'
import * as process from 'process'
import {stderr as supportsColor} from 'supports-color'
import {Command, Config, InvalidConfig} from './config'


export async function run(config: Config, command: string, args?: string[]): Promise<number> {
    for (let [name, cmd] of createPlan(config, command)) {
        if (args?.length && name == command) {
            cmd = {
                ...cmd,
                cmd: (cmd.cmd ?? []).concat(args)
            }
        }
        if (!cmd.cmd) continue
        printCommandLabel(name)
        let exitCode = await execute(config, cmd)
        if (exitCode > 0) {
            return exitCode
        }
    }
    return 0
}


function createPlan(config: Config, command: string): [name: string, cmd: Command][] {
    let list: [name: string, cmd: Command][] = []
    let visited = new Set<string>()
    let path = new Set<string>()

    function visit(name: string): void {
        if (visited.has(name)) return
        if (path.has(name)) throw new InvalidConfig(`command \`${name}\` depends on itself`)

        path.add(name)

        let cmd = config.commands?.[name]
        if (cmd == null) {
            throw new UndefinedCommand(name, config.file)
        }

        cmd.deps?.forEach(visit)

        list.push([name, cmd])
        path.delete(name)
        visited.add(name)
    }

    visit(command)

    return list
}


export class UndefinedCommand extends Error {
    constructor(cmd: string, public readonly file?: string) {
        super(`\`${cmd}\` is not defined`)
    }

    get name(): string {
        return 'UndefinedCommand'
    }
}


async function execute(config: Config, command: Command): Promise<number> {
    let loc = Path.dirname(Path.resolve(config.file))
    let cwd = command.workdir ? Path.join(loc, command.workdir) : loc

    let cmd = assertNotNull(command.cmd)
    let args: string[] = []
    for (const arg of cmd) {
        if (typeof arg == 'string') {
            args.push(arg)
        } else {
            let expanded = await glob(arg.glob, {cwd})
            args.push(...expanded)
        }
    }

    let env = {...process.env, ...command.env}
    extendPath(env, loc)

    return new Promise<number>((resolve, reject) => {
        let proc = spawn(args[0], args.slice(1), {
            cwd,
            env,
            stdio: 'inherit',
            shell: process.platform == 'win32' // support .bat, .cmd
        })

        proc.on('error', err => {
            reject(err)
        })

        proc.on('close', code => {
            if (code != null) {
                resolve(code)
            }
        })
    })
}

/**
 * The art from npm - https://github.com/npm/run-script/blob/ff5849aee6890c0c5a5b3bc0b6b783f45c4b71c9/lib/set-path.js#L9
 */
function extendPath(env: typeof process.env, root: string): void {
    let paths = Object.keys(env).filter(p => /^path$/i.test(p) && env[p])
        .map(p => env[p]!.split(Path.delimiter))
        .reduce((set, p) => set.concat(p.filter(concatted => !set.includes(concatted))), [])

    paths.unshift(
        Path.resolve(root, 'node_modules/.bin')
    )

    let pathValue = paths.join(Path.delimiter)

    for (let key in env) {
        if (/^path$/i.test(key)) {
            env[key] = pathValue
        }
    }
}


const LOG = createLogger('sqd:commands')


function printCommandLabel(name: string): void {
    if (process.stderr.isTTY) {
        let line = name.toUpperCase()
        if (supportsColor) {
            line = '\u001b[1m' + line + '\u001b[0m'
        }
        console.error(line)
    } else {
        LOG.info(name.toUpperCase())
    }
}

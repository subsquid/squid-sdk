import {assertNotNull} from '@subsquid/util-internal'
import {spawn} from 'child_process'
import * as Path from 'path'
import * as process from 'process'
import {stderr as supportsColor} from 'supports-color'
import {Command, Config, InvalidConfig} from './config'


export async function run(config: Config, commands: string[]): Promise<number> {
    for (let [name, cmd] of createPlan(config, commands)) {
        if (!cmd.cmd) continue
        printCommandLabel(name)
        let exitCode = await execute(config, cmd)
        if (exitCode > 0) {
            return exitCode
        }
    }
    return 0
}


function createPlan(config: Config, commands: string[]): [name: string, cmd: Command][] {
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

    for (let name of commands) {
        visit(name)
    }

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


function execute(config: Config, command: Command): Promise<number> {
    let args = assertNotNull(command.cmd)
    let cwd = Path.dirname(Path.resolve(config.file))
    let env = {...process.env, ...command.env}
    extendPath(env, cwd)
    return new Promise<number>((resolve, reject) => {
        let proc = spawn(args[0], args.slice(1), {
            cwd: command.workdir ? Path.join(cwd, command.workdir) : cwd,
            env,
            stdio: 'inherit'
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


function printCommandLabel(name: string): void {
    let line = name.toUpperCase()
    if (supportsColor) {
        line = '\u001b[1m' + line + '\u001b[0m'
    }
    console.error(line)
}

import {Command} from "commander"
import * as process from "process"
import {Workspace} from "./workspace"


interface Options {
    update: boolean
    major?: string[]
    dry?: boolean
}


async function main(): Promise<void> {
    let command = new Command()
    command.description('Unifies and optionally updates dependencies across rush project')
    command.option('--update', 'update dependencies', false)
    command.option('-m, --major [...packages]', 'allow major update for a package')
    command.option('--dry', 'do not perform real changes')
    command.parse()

    let options: Options = command.opts()
    let workspace = new Workspace(process.cwd())

    if (options.update) {
        await workspace.update(new Set(options.major))
    }

    workspace.unify()

    if (!options.dry) {
        workspace.save()
    }
}


main().catch(err => {
    console.error(err)
    process.exit(1)
})

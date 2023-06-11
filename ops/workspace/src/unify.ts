import {runProgram} from '@subsquid/util-internal'
import {Command} from 'commander'
import * as process from 'process'
import {Workspace} from './workspace'


interface Options {
    update: boolean
    major?: boolean
    dry?: boolean
    lower?: boolean
}


runProgram(async () => {
    let command = new Command()
    command.description('Unifies and optionally updates dependencies across rush project')
    command.option('--lower', 'when unifying versions, prefer the lowest')
    command.option('--update', 'update dependencies', false)
    command.option('--major', 'allow major update for a package')
    command.option('--dry', 'do not perform real changes')
    command.parse()

    let options: Options = command.opts()
    let workspace = new Workspace(process.cwd(), {
        preferLowerVersion: options.lower
    })

    if (options.update) {
        await workspace.update(options.major)
    }

    workspace.unify()

    if (!options.dry) {
        workspace.save()
    }
})

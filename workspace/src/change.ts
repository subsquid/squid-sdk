import {assertNotNull, OutDir} from "@subsquid/util"
import {Command, Option} from "commander"
import * as fs from "fs"
import * as path from "path"
import * as process from "process"


interface Options {
    package: string
    type: string
    message: string
}


async function main(): Promise<void> {
    let command = new Command()
    command.description('Create change file for a package')
    command.requiredOption('-p, --package <dir>', 'package dir (must be relative to workspace root)')
    command.addOption(
        new Option('-t, --type <type>', 'type of change').choices([
            'major',
            'minor',
            'patch',
            'none'
        ]).makeOptionMandatory(true)
    )
    command.requiredOption('-m, --message <text>', 'change description')
    command.parse()

    let options: Options = command.opts()
    let pkgJsonLoc = path.join(options.package, 'package.json')
    let pkg = JSON.parse(fs.readFileSync(pkgJsonLoc, 'utf-8'))
    let packageName = assertNotNull(pkg.name, `.name is not defined in ${pkgJsonLoc}`)

    let dir = new OutDir('common/changes').child(packageName)

    dir.write(createChangeFileName(), JSON.stringify({
        changes: [
            {
                packageName,
                type: options.type,
                comment: options.message
            }
        ],
        packageName
    }, null, 2))
}


function createChangeFileName(): string {
    let now = new Date()
    return `dev_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}__${now.getTime()}.json`
}


main().catch(err => {
    console.error(err)
    process.exit(1)
})

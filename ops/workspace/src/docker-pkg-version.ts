import {assertNotNull} from "@subsquid/util-internal"
import * as process from "process"
import {Workspace} from "./workspace"


const packageName = assertNotNull(
    process.argv[2],
    'last segment of a package name should be passed as a first argument to this script'
)


const workspace = new Workspace(process.cwd())


for (let [name, pkg] of workspace.packages().entries()) {
    if (name == packageName || name.endsWith('/' + packageName)) {
        let version = assertNotNull(pkg.json.version, `version is not defined for ${name}`)
        console.log(version)
        process.exit()
    }
}

console.error(`package ${packageName} not found`)
process.exit(1)

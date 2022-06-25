import {MIGRATIONS_DIR} from "@subsquid/typeorm-config"
import {runProgram} from "@subsquid/util-internal"
import {OutDir} from "@subsquid/util-internal-code-printer"
import {program} from "commander"


runProgram(async () => {
    program.description('Create template file for a new migration')
    program.option('--name', 'name suffix for new migration', 'Data')

    let {name} = program.parse().opts() as {name: string}

    let dir = new OutDir(MIGRATIONS_DIR)
    let timestamp = Date.now()
    let out = dir.file(`${timestamp}-${name}.js`)
    out.block(`module.exports = class ${name}${timestamp}`, () => {
        out.line(`name = '${name}${timestamp}'`)
        out.line()
        out.block(`async up(db)`, () => {
            out.line()
        })
        out.line()
        out.block(`async down(db)`, () => {
            out.line()
        })
    })
    out.write()
})

import {program} from "commander"

program.description(`
A wrapper around TypeORM migration commands aware of squid project conventions
`.trim())


program.command('apply', 'apply pending migrations')
program.command('create', 'create template file for a new migration')
program.command('generate', 'analyze database state and generate migration to match the target schema')
program.command('revert', 'revert the last applied migration')
program.parse()

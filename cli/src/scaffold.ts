import * as path from 'path'
import * as version from './versions'
import {OutDir} from '@subsquid/util'
import {randomInteger, render, resource} from './utils'

export interface ScaffoldOptions {
    targetDir: string
    withServer?: boolean
    withServerExtension?: boolean
}

export function scaffold(options: ScaffoldOptions): void {
    const dst = path.resolve(options.targetDir)
    const dir = new OutDir(dst)

    const env = {
        projectName: path.basename(dst),
        graphqlPort: randomInteger(4000, 4999),
        dbPort: randomInteger(5000, 6000),
        indexerPort: randomInteger(6001, 7000),
    }

    {
        const pkg: any = {}
        pkg.name = env.projectName
        pkg.private = true
        pkg.scripts = {
            typegen: 'hydra-typegen typegen manifest.yml',
            codegen: 'hydra-cli codegen',
            build: 'tsc',
            'db:create': 'squid db:create',
            'db:drop': 'squid db:drop',
            'db:create-migration': 'squid db:create-migration',
            'db:migrate': 'squid db:migrate',
            'db:revert': 'squid db:revert',
            'db:reset':
                'squid db:drop && squid db:create && squid db:migrate',
            'processor:start': 'node lib/mappings/index.js',
            'query-node:start': 'node ./lib/generated/server.js',
        }
        pkg.dependencies = {}
        pkg.devDependencies = {}
        if (options.withServer) {
            pkg.dependencies['@subsquid/openreader'] = version.openreader
        }
        pkg.dependencies['@subsquid/util'] = version.util
        pkg.dependencies['@subsquid/substrate-processor'] = version.substrateProcessor
        if (options.withServer && options.withServerExtension) {
            pkg.dependencies['class-validator'] = version.classValidator
            pkg.dependencies['type-graphql'] = version.typeGraphql
        }
        pkg.dependencies.typeorm = version.typeorm
        pkg.devDependencies['@subsquid/cli'] = version.squid
        pkg.devDependencies['@types/pg'] = version.pgTypes
        pkg.devDependencies.typescript = version.typeScript
        dir.write('package.json', JSON.stringify(pkg, undefined, 2))
    }

    dir.add('manifest.yml', resource('scaffold/manifest.yml'))
    dir.add('tsconfig.json', resource('scaffold/tsconfig.json'))
    dir.add('docker-compose.yml', resource('scaffold/docker-compose.yml'))
    dir.add('src/mappings/index.ts', resource('scaffold/src/mappings/index.ts'))
    dir.write('schema.graphql', '\n')
    dir.write('.env', render('scaffold/.env', env))
    dir.write(
        'indexer/docker-compose.yml',
        render('scaffold/indexer/docker-compose.yml', env)
    )
}

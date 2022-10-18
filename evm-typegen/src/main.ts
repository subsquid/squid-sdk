import {program} from 'commander'
import path from 'path'
import process from 'process'
import fs from 'fs'
import {AbiOptions, Typegen} from './typegen'
import assert from 'assert'

export function run(): void {
    program
        .description(
            `Generates TypeScript definitions for evm log events ` +
                `for use within substrate-processor mapping handlers.`
        )
        .requiredOption('--abi <path>', 'path to a JSON abi file')
        .requiredOption('--output <path>', 'path for output typescript file')

    program.parse()

    const options = program.opts()
    const inputPath = options.abi
    const outputPath = options.output

    const parsedInputPath = path.parse(inputPath)
    const inputFiles = new Array<string>()

    if (parsedInputPath.name === '*' && parsedInputPath.ext === '') {
        const dir = parsedInputPath.dir
        const files = fs.readdirSync(dir).filter((file) => path.extname(file) === '.json')
        assert(files.length > 0, `Dicrectiry ${dir} contains no *.json files`)
        inputFiles.push(...files.map((file) => path.join(dir, file)))
    } else {
        assert(parsedInputPath.ext === '.json', 'Invalid abi file extension')
        inputFiles.push(inputPath)
    }

    const abi: AbiOptions[] = inputFiles.map((file) => ({
        name: path.basename(file, '.json'),
        fragments: JSON.parse(fs.readFileSync(file, {encoding: 'utf-8'})),
    }))

    new Typegen({abi, outDir: path.resolve(outputPath)}).generate()
}

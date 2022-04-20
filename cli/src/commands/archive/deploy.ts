import { readFileSync, readFile } from 'fs';
import path from 'path';
import { promisify } from 'util';
import yaml from 'js-yaml';
import { Command, Flags } from '@oclif/core';
import { baseUrl } from '../../rest-client/baseUrl';
import { request } from '../../rest-client/request';
import { getCreds } from '../../creds';

const readFileAsync = promisify(readFile)

type File = { name: string, url: string } | { name: string, data: string }

async function processFiles(files: File[], basePath: string) {
    return Promise.all(files.map(async (file) => {
        console.log(file)
        if ('data' in file) {
            return file;
        }
        else if (file.url.startsWith('http://') || file.url.startsWith('https://')) {
            return file;
        }

        return {
            name: file.name,
            data: await readFileAsync(path.join(basePath, file.url), 'utf-8')
        }
    }))
}

type Manifest = {
    archive?: {
        indexer?: {
            files?: File[]
        }
    }
}

export default class Deploy extends Command {
    static description = 'Deploy an archive';
    static args = [
        {
            name: 'name',
            description: 'archive name',
            required: true,
        },
    ];

    static flags = {
        manifestPath: Flags.string({
            char: 'm',
            description: 'manifest path',
            required: false,
            default: './manifest.yaml'
        }),
        reset: Flags.boolean({
            char: 'r',
            description: 'reset database',
            required: false,
            default: false
        }),
    };

    async run(): Promise<void> {
        const { flags: { manifestPath, reset }, args: { name } } = await this.parse(Deploy);

        const manifest = yaml.load(readFileSync(manifestPath, 'utf-8')) as Manifest;
        const basePath = path.dirname(path.resolve(manifestPath))

        if (manifest.archive?.indexer?.files?.length) {
            manifest.archive.indexer.files = await processFiles(manifest.archive.indexer.files, basePath);
        }

        const response = await request(`${baseUrl}/client/archives`, {
            method: 'post',
            body: JSON.stringify({
                name,
                manifest,
                reset,
            }),
            headers: {
                'Content-Type': 'application/json',
                authorization: `token ${getCreds()}`,
            },
        });
        const responseBody = await response.json();
        if (response.status === 200) {
            this.log(`Created archive with name ${responseBody.name}`);
        }
    }
}

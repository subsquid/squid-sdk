import { Flags } from '@oclif/core';
import { existsSync, readFileSync } from 'fs';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { releaseSquid } from '../../api';
import { CliCommand } from '../../command';
import {
    buildRemoteUrlFromGit,
    parseNameAndVersion,
    pollDeployPipelines,
} from '../../utils';

const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
};
const git: SimpleGit = simpleGit(options);

export function getEnv(e: string): { name: string, value: string } {
    const variable = /^(?<name>.*)=(?<value>.*)$/.exec(e);
    if (variable == null || variable.groups == null) {
        throw new Error(`❌ An error occurred during parsing variable "${e}"`);
    }
    return { name: variable.groups.name, value: variable.groups.value }
}

export function mergeEnvWithFile(envs: Record<string, string>, path: string) {
    if (!existsSync(path)) return envs;
    return readFileSync(path)
        .toString()
        .replace(/\r\n/g,'\n')
        .split('\n')
        .reduce((res, e: string) => {
            const {name, value} = getEnv(e);
            return {...res, [name]: value};
        }, { ...envs })
}

export function parseEnvs(envFlags: string[] | undefined, envFilePath: string | undefined) {
    let envs: Record<string, string> = {} 
        
    envFlags?.forEach((e: string)=>{
        const { name, value } = getEnv(e);
        envs[name] = value;
    });
    
    if (envFilePath != undefined)
        envs = mergeEnvWithFile(envs, envFilePath)
    
    return envs
}

export default class Release extends CliCommand {
    static description = 'Create a new squid version';
    static args = [
        {
            name: 'nameAndVersion',
            description: 'name@version',
            required: true,
        },
    ];

    static flags = {
        source: Flags.string({
            char: 's',
            description: 'A fully qualified git url, e.g. https://github.com/squidlover/my-squid.git#v5',
            required: false,
        }),
        description: Flags.string({
            char: 'd',
            description: 'description',
            required: false,
        }),
        verbose: Flags.boolean({
            char: 'v',
            description: 'verbose',
            required: false,
        }),
        env: Flags.string({
            char: 'e',
            description: 'environment variable',
            required: false,
            multiple: true,
        }),
        envFile: Flags.string({
            description: 'file with environment variables',
            required: false,
        }),
    };

    async run(): Promise<void> {
        const { flags, args } = await this.parse(Release);
        const description = flags.description;
        const nameAndVersion = args.nameAndVersion;
        const { squidName, versionName } = parseNameAndVersion(
            nameAndVersion,
            this
        );

        const envs = parseEnvs(flags.env, flags.envFile);

        let deployUrl = flags.source;
        if (!deployUrl) {
            deployUrl = await buildRemoteUrlFromGit(git, this);
        } else {
            deployUrl = deployUrl.split('#')[0].endsWith('.git')
                ? deployUrl
                : `${deployUrl.split('#')[0]}.git${
                      deployUrl.split('#')[1]
                          ? '#' + deployUrl.split('#')[1]
                          : ''
                  }`;
        }
        
        this.log(`🦑 Releasing the squid at ${deployUrl}`);
        const result = await releaseSquid(
            squidName,
            versionName,
            deployUrl as string,
            description,
            Object.keys(envs).length ? envs : undefined
        );
        this.log(
            '◷ You may now detach from the build process by pressing Ctrl + C. The Squid deployment will continue uninterrupted.'
        );
        this.log(
            '◷ The new squid will be available as soon as the deployment is complete.'
        );
        await pollDeployPipelines(
            squidName,
            versionName,
            result?.version.deploymentUrl || '',
            this,
        );
        this.log('✔️ Done!');
    }
}

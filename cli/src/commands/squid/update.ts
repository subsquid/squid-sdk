import { Flags } from '@oclif/core';
import { existsSync, readFileSync } from 'fs';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { updateSquid } from '../../api';
import { CliCommand } from '../../command';
import {
    buildRemoteUrlFromGit,
    parseNameAndVersion,
    pollDeployPipelines,
} from '../../utils';
import { parseEnvs } from './release';

const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
};
const git: SimpleGit = simpleGit(options);

export default class Update extends CliCommand {
    static description = 'Update a version image';
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
            description: 'source',
            required: false,
        }),
        hardReset: Flags.boolean({
            char: 'r',
            description: 'perform a hard reset (db wipeout)',
            required: false,
            default: false
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
        const { flags, args } = await this.parse(Update);
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
        const result = await updateSquid(
            squidName,
            versionName,
            deployUrl as string,
            flags.hardReset,
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
            result?.deploymentUrl || '',
            this,
        );
        this.log('✔️ Done!');
    }
}

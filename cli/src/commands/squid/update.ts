import { Command, Flags } from '@oclif/core';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { update } from '../../rest-client/routes/update';
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

export default class Update extends Command {
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
        })
    };

    async run(): Promise<void> {
        const { flags, args } = await this.parse(Update);
        const nameAndVersion = args.nameAndVersion;
        const { squidName, versionName } = parseNameAndVersion(
            nameAndVersion,
            this
        );
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
        this.log(`🦑 Releasing the Squid at ${deployUrl}`);
        const result = await update(
            squidName,
            versionName,
            deployUrl as string,
            flags.hardReset
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
            this
        );
        this.log('✔️ Done!');
    }
}

import { Command, Flags } from '@oclif/core';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { release } from '../../rest-client/routes/release';
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

export default class Release extends Command {
    static description = 'Create a version';
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
        description: Flags.string({
            char: 'd',
            description: 'description',
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
        const result = await release(
            squidName,
            versionName,
            deployUrl as string,
            description
        );
        this.log(
            '◷ You can detach from the resulting build process by pressing Ctrl + C. This does not cancel the deploy.'
        );
        this.log(
            '◷ The deploy will continue in the background and will create a new squid as soon as it completes.'
        );
        await pollDeployPipelines(
            squidName,
            versionName,
            result?.version.deploymentUrl || '',
            this
        );
        this.log('✔️ Done!');
    }
}

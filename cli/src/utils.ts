import { Command } from '@oclif/core';
import cliSelect from 'cli-select';
import { DefaultLogFields, LogOptions, RemoteWithRefs, SimpleGit } from 'simple-git';

export async function buildRemoteUrlFromGit(
    git: SimpleGit,
    command: Command
): Promise<string> {
    let remoteUrl: RemoteWithRefs;
    const remotes = await git.getRemotes(true);
    if (remotes.length === 0) {
        command.error(`The remotes were not found`, { code: '1' });
    } else if (remotes.length === 1) {
        remoteUrl = remotes[0];
    } else {
        const selected = await cliSelect({
            cleanup: false,
            values: remotes.map((remote) => remote.name),
        }).catch(() => {
            command.error('Canceled', { code: '1' });
        });
        remoteUrl = remotes.find(
            (remote) => remote.name === selected.value
        ) as RemoteWithRefs;
    }
    await git.listRemote([remoteUrl.name]).catch(() => {
        command.error(`Remote url with name ${remoteUrl.name} not exists`, {
            code: '1',
        });
    });
    const branch = (await git.branch()).current;
    const status = await git.status();
    if (status.files && status.files.length) {
        command.error(`There are unstaged or uncommitted changes`);
    }
    await git.fetch();
    const remoteBranchRefs = await git.listRemote([
        `${remoteUrl.name}`,
        `${branch}`,
    ]);
    if (remoteBranchRefs === '') {
        command.error(`Remote branch "${remoteUrl.name}/${branch}" not exists`);
    }
    const localCommit = await git.log([
        '-n',
        1,
        branch,
    ] as LogOptions<DefaultLogFields>);
    const remoteCommit = await git.log([
        '-n',
        1,
        `${remoteUrl.name}/${branch}`,
    ] as LogOptions<DefaultLogFields>);
    if (
        !localCommit.latest ||
        !remoteCommit.latest ||
        localCommit.latest.hash !== remoteCommit.latest.hash
    ) {
        command.error(
            `Head origin commit is not the same as the local origin commit`
        );
    }
    return `${remoteUrl.refs.fetch}${
        remoteUrl.refs.fetch.endsWith('.git') ? '' : '.git'
    }#${remoteCommit.latest.hash}`;
}

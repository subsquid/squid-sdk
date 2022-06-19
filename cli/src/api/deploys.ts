import { CliUx, Command } from '@oclif/core';
import { dim } from 'chalk';

import { DeployResponse, DeployStatus, HttpResponse, SquidResponse } from './types';
import { api } from './api';
import { getSquid } from './squids';

export async function waitDeploy(command: Command, { payload: squid }: HttpResponse<SquidResponse>, {
  verbose = false
}: { verbose?: boolean} = {}): Promise<void> {
  let lastStatus = null;

  if (!squid.deploy || !squid.versions.length) {
    command.error( `❌ An error occurred. Unexpected Squid response from API.
  -----
  ${dim('Response:')} ${squid}
    `);
    return
  }

  let isLogPrinted = false;
  const deployedVersion = squid.versions[0];

  const traceDebug = `
  ------
  Please report to t.me/HydraDevs 
  ${dim('Squid:')} ${squid?.name}
  ${dim('Version:')} ${deployedVersion?.name}
  ${dim('Deploy:')} ${squid?.deploy.id}
  `
  while (true) {
    const { body } = await api<HttpResponse<DeployResponse>>({
      method: 'get',
      path: `/client/deploys/${squid.deploy.id}`
    });

    const deploy = body.payload;

    if (deploy.status !== lastStatus) {
      lastStatus = deploy.status;
      CliUx.ux.action.stop('✔️');
    }

    switch (deploy?.status) {
      case DeployStatus.DEPLOYING:
        CliUx.ux.action.start('◷ Preparing your squid');
        if (deploy.failed) {
          command.error(`❌ An error occurred during building process.${traceDebug}`);
        }
        break;
      case DeployStatus.IMAGE_BUILDING:
        CliUx.ux.action.start('◷ Building your squid');
        if (deploy.failed) {
          command.error(`❌ An error occurred during building process.${traceDebug}`)
        }
        break;
      case DeployStatus.INITIALIZING:
        CliUx.ux.action.start('◷ Almost ready');

        if (verbose && !isLogPrinted) {
          command.log(dim(deploy.logs.join('\n')))
          isLogPrinted = true
        }

        if (deploy.failed) {
          command.error(`❌ An error occurred during deploying process.${traceDebug}`);
        }
        break;
      case DeployStatus.DONE:
        const { versions } = await getSquid(squid.name);
        const version = versions.find(v => v.name === deployedVersion.name);

        if (!version || version.status !== 'DEPLOYED') {
          command.log(`◷ Sorry, but your squid was deployed with errors`);
          if (!isLogPrinted) {
            command.log(dim(deploy.logs.join('\n')))
          }

          return
        }

        command.log(`◷ Your squid is ready and is accessible on ${version.deploymentUrl}`);

        return
      default:
        command.error(`❌ An error occurred. Unexpected status of deploy.${traceDebug}`);
        return
    }


    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

import { Command } from '@oclif/core';
import { CLIError } from '@oclif/core/lib/errors';
import { ApiError } from './api';

export abstract class CliCommand extends Command {
  async catch(error: any) {
    const {status, body} = error;

    if(error instanceof ApiError) {
      switch (status) {
        case 401:
          throw new CLIError(
            `Authentication failure. Please obtain a new deployment key at https://app.subsquid.io and follow the instructions`
          );
        case 400:
          this.error(body.message);
          return
        case 404:
          this.error(body?.message || 'API url not found');
          return
        default:
          this.error('Squid server error. Please come back later. If the error persists please open an issue at https://github.com/subsquid/squid and report to t.me/HydraDevs');
          return
      }
    }

    throw error;
  }
}

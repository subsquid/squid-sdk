import { Command } from '@oclif/core';
import { dim } from 'chalk';
import { ApiError } from './api';
import { CLIError } from '@oclif/core/lib/errors';

export abstract class CliCommand extends Command {
  async catch(error: ApiError | any) {
    if (error instanceof ApiError) {
      const {status, body} = error;

      switch (status) {
        case 401:
          throw new CLIError(
            `Authentication failure. Please obtain a new deployment key at https://app.subsquid.io and follow the instructions`
          );
        case 400:
          if (!body.invalidFields?.length) {
            this.error(body.error);
            return
          }

          this.error(
            [
              `${body.error}`,
              ...body.invalidFields.map((v, i) => `${dim(`${i+1})`)} ${v.message}`)
            ].join('\n')
          );
          return
        case 404:
          this.error(body?.error || 'url not found');
          return
        default:
          this.error('Squid server error. Please come back later. If the error persists please open an issue at https://github.com/subsquid/squid and report to t.me/HydraDevs');
          return
      }
    }

    throw error;
  }
}

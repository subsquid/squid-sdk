import { createOrmConfig } from '@subsquid/typeorm-config';
import * as dotenv from 'dotenv';
import { Command } from '@oclif/core';
import { ConnectionOptions, createConnection } from 'typeorm';

export default class RevertDb extends Command {
  static description = 'Revert the last performed migration';

  async run(): Promise<void> {
    dotenv.config();

    const cfg: ConnectionOptions = {
      ...createOrmConfig(),
      subscribers: [],
      synchronize: false,
      migrationsRun: false,
      dropSchema: false,
      logging: ['query', 'error', 'schema']
    };

    const connection = await createConnection(cfg);
    try {
      await connection.undoLastMigration({ transaction: 'all' });
    } finally {
      await connection.close().catch(err => null);
    }
  }
}

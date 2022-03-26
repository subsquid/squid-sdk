import { Command } from '@oclif/core';
import { createOrmConfig } from '@subsquid/typeorm-config';
import * as dotenv from 'dotenv';
import { ConnectionOptions, createConnection } from 'typeorm';

export default class Migrate extends Command {
  static description = 'Apply database migrations';

  async run(): Promise<void> {
    dotenv.config();

    const cfg: ConnectionOptions = {
      ...createOrmConfig(),
      subscribers: [],
      synchronize: false,
      migrationsRun: false,
      dropSchema: false,
      logging: ['query', 'error', 'schema'],
    };

    const connection = await createConnection(cfg);
    try {
      await connection.runMigrations({ transaction: 'all' });
    } finally {
      await connection.close().catch(err => null);
    }
  }
}

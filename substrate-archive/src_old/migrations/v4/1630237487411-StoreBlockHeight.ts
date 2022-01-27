import { MigrationInterface, QueryRunner } from 'typeorm'

export class StoreBlockHeight1630237487411 implements MigrationInterface {
  public async up(db: QueryRunner): Promise<void> {
    db.query(`
        CREATE TABLE status (
          id int primary key,
          height integer not null
        )
      `)
    db.query(`
        INSERT INTO status (id, height) VALUES (0, -1)
      `)
    db.query(`
        UPDATE status
        SET height = events.block_number
        FROM (SELECT block_number
              FROM substrate_event e1
              WHERE NOT EXISTS(
                      SELECT NULL
                      FROM substrate_event e2
                      WHERE e2.block_number = e1.block_number + 1)
              ORDER BY block_number
              LIMIT 1) as events
        WHERE status.id = 0
      `)
  }

  public async down(db: QueryRunner): Promise<void> {
    db.query('DROP TABLE status')
  }
}

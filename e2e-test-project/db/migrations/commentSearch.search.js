module.exports = class commentSearch64060578000000 {
  name = 'commentSearch64060578000000'

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "transfer" ADD COLUMN "comment_search_tsv" tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(comment, '')), 'A')) STORED`)
    await queryRunner.query(`CREATE INDEX "comment_search_transfer_idx" ON "transfer" USING GIN ("comment_search_tsv")`)
  }

  async down(queryRunner) {
    await queryRunner.query('DROP INDEX "comment_search_transfer_idx"')
    await queryRunner.query('ALTER TABLE "transfer" DROP "comment_search_tsv"')
  }
}

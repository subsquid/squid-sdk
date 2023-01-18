module.exports = class Data1672219003175 {
    name = 'Data1672219003175'

    async up(db) {
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "timestamp" numeric NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "amount" numeric NOT NULL, "tags" text array, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_f4007436c1b546ede08a4fd7ab" ON "transfer" ("amount") `)
        await db.query(`CREATE INDEX "IDX_2e921e683d651101b2f4b5c6f3" ON "transfer" ("timestamp", "from", "to") `)
        await db.query(`CREATE INDEX "IDX_807712b152d3409e4cc1bf5361" ON "transfer" ("from", "to") `)
    }

    async down(db) {
        await db.query(`DROP TABLE "transfer"`)
        await db.query(`DROP INDEX "public"."IDX_f4007436c1b546ede08a4fd7ab"`)
        await db.query(`DROP INDEX "public"."IDX_2e921e683d651101b2f4b5c6f3"`)
        await db.query(`DROP INDEX "public"."IDX_807712b152d3409e4cc1bf5361"`)
    }
}

module.exports = class Data1770700000000 {
    name = 'Data1770700000000'

    async up(db) {
        await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
        await db.query(
            `CREATE TABLE "swap" ("id" character varying NOT NULL, "dex_type" character varying(9) NOT NULL, "block_number" integer NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "tx" text NOT NULL, "amount0_in" numeric NOT NULL, "amount1_in" numeric NOT NULL, "amount0_out" numeric NOT NULL, "amount1_out" numeric NOT NULL, "sender_id" character varying, "to_id" character varying, CONSTRAINT "PK_swap" PRIMARY KEY ("id"))`,
        )
        await db.query(`CREATE INDEX "IDX_swap_sender_id" ON "swap" ("sender_id") `)
        await db.query(`CREATE INDEX "IDX_swap_to_id" ON "swap" ("to_id") `)
        await db.query(
            `CREATE TABLE "tracked_pair" ("id" character varying NOT NULL, "dex_type" character varying(9) NOT NULL, "token0" text NOT NULL, "token1" text NOT NULL, "discovered_at_block" integer NOT NULL, CONSTRAINT "PK_tracked_pair" PRIMARY KEY ("id"))`,
        )
    }

    async down(db) {
        await db.query(`DROP TABLE "swap"`)
        await db.query(`DROP TABLE "account"`)
        await db.query(`DROP TABLE "tracked_pair"`)
    }
}

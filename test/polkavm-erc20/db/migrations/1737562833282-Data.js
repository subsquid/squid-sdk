module.exports = class Data1737562833282 {
    name = 'Data1737562833282'

    async up(db) {
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "from" text, "to" text, "amount" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "block" integer NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "transfer"`)
    }
}

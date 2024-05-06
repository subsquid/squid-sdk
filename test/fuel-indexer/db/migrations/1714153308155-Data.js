module.exports = class Data1714153308155 {
    name = 'Data1714153308155'

    async up(db) {
        await db.query(`CREATE TABLE "contract" ("id" character varying NOT NULL, "logs_count" integer NOT NULL, "found_at" integer NOT NULL, CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "contract"`)
    }
}

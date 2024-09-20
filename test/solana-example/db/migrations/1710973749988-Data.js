module.exports = class Data1710973749988 {
    name = 'Data1710973749988'

    async up(db) {
        await db.query(`CREATE TABLE "exchange" ("id" character varying NOT NULL, "slot" integer NOT NULL, "tx" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "from_owner" text NOT NULL, "from_token" text NOT NULL, "from_amount" numeric NOT NULL, "to_owner" text NOT NULL, "to_token" text NOT NULL, "to_amount" numeric NOT NULL, CONSTRAINT "PK_cbd4568fcb476b57cebd8239895" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "exchange"`)
    }
}

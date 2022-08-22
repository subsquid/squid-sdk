module.exports = class Data1658495320760 {
  name = 'Data1658495320760'

  async up(db) {
    await db.query(`CREATE TABLE "account" ("id" character varying NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`)
    await db.query(`CREATE TABLE "token_mint" ("id" character varying NOT NULL, "name" text NOT NULL, "description" text NOT NULL, "media" text NOT NULL, "reference" text NOT NULL, "successful" boolean, "account_id" character varying, CONSTRAINT "PK_7af887533eb36bd24b7281aac88" PRIMARY KEY ("id"))`)
    await db.query(`CREATE INDEX "IDX_46b83a79f5153e5f177eef8474" ON "token_mint" ("account_id") `)
    await db.query(`ALTER TABLE "token_mint" ADD CONSTRAINT "FK_46b83a79f5153e5f177eef8474d" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
  }

  async down(db) {
    await db.query(`DROP TABLE "account"`)
    await db.query(`DROP TABLE "token_mint"`)
    await db.query(`DROP INDEX "public"."IDX_46b83a79f5153e5f177eef8474"`)
    await db.query(`ALTER TABLE "token_mint" DROP CONSTRAINT "FK_46b83a79f5153e5f177eef8474d"`)
  }
}

module.exports = class Data1652864772756 {
  name = 'Data1652864772756'

  async up(db) {
    await db.query(`CREATE TABLE "flip" ("id" character varying NOT NULL, "value" boolean NOT NULL, "caller" text NOT NULL, "timestamp" numeric NOT NULL, CONSTRAINT "PK_7458ac325f1fed2f495ec6aa72c" PRIMARY KEY ("id"))`)
  }

  async down(db) {
    await db.query(`DROP TABLE "flip"`)
  }
}

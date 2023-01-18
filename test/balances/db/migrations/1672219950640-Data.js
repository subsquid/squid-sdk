module.exports = class Data1672219950640 {
    name = 'Data1672219950640'

    async up(db) {
        await db.query(`CREATE INDEX IDX_transfers__tags ON transfer USING gin (tags)`)
    }

    async down(db) {
        await db.query('DROP INDEX IDX_transfers__tags')
    }
}

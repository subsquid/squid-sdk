# @subsquid/typeorm-migration

A thin wrapper around [TypeORM migration tools](https://typeorm.io/migrations),
which understands and follows squid project conventions.

## Usage

```bash
# 1. Install
npm i @subsquid/typeorm-migration

# 2. List available commands
npx squid-typeorm-migration --help
```

```
apply           apply pending migrations
create          create template file for a new migration
generate        analyze database state and generate migration to match the target schema
revert          revert the last applied migration
```

## Rules

* All migrations should be written as plain commonjs files and placed at `db/migrations` 
* All entities should be exported from `lib/model` commonjs module, i.e. 
entity classes must be compiled from TypeScript before running `squid-typeorm-migration generate`.
* Database connection settings are picked from `DB_*` environment variables.

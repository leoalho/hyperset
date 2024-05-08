const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const {open} = require("sqlite");

const main = async () => {
    const db = await open({
        filename: process.env.DATABASE,
        driver: sqlite3.Database
    })

    const migrations = fs.readdirSync("./migrations");

    const sortedMigrations = migrations.sort();

    const migrationsWithVersions = sortedMigrations.map((migration) => {
        const version = parseInt(migration.split("_")[0]);
        return {version, migration: migration}});

    const {user_version} = await db.get("PRAGMA user_version;")

    if (migrationsWithVersions[migrationsWithVersions.length-1].version===user_version){
        console.log("Your db is already up to date :)")
    } else {
        for (const migration of migrationsWithVersions) {
            if (migration.version > user_version) {
                const migrationSql = fs.readFileSync(path.join("migrations", migration.migration), "utf-8");
                console.log("Running migration", migration.migration)
                await db.exec(migrationSql)
                await db.exec(`PRAGMA user_version = ${migration.version};`)
            }
        }
        console.log("Db up to date! :)")
    }
    db.close();
}

main();

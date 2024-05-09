const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const dbConnect = async () => {
    const db = await open({
        filename: process.env.DATABASE,
        driver: sqlite3.Database
    })
    console.log("Connected to database", process.env.DATABASE)
    return db
}

module.exports = dbConnect
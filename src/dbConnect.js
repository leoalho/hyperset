const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const dbConnect = async () => {
    const db = await open({
        filename: process.env.DATABASE,
        driver: sqlite3.Database
    })
    return db
}

export default dbConnect
import {open} from "sqlite";
import sqlite3 from "sqlite3";

const dbConnect = async () => {
    const db = await open({
        filename: process.env.DATABASE || "testi.db",
        driver: sqlite3.Database
    })
    console.log("Connected to database", process.env.DATABASE)
    return db
}

module.exports = dbConnect
require('dotenv').config();
const { MongoClient } = require("mongodb");

const newURI = `mongodb://${process.env.USER_NAME}:${process.env.USER_PWD}@${process.env.MONGODB_URI}`
const client = new MongoClient(newURI);
//const client = new MongoClient(process.env.MONGOURI);
const database = client.db('testi');

const connectDB = () => {
    console.log(`Connecting to db ${newURI}`)
    client.connect()
    console.log('connected to db')
}

module.exports = {
    connectDB, database
}
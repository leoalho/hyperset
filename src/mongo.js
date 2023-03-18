require('dotenv').config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PWD}@${process.env.MONGODB_URI}/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const database = client.db('joukko');

const connectDB = async () => {
    console.log(`Connecting to db ${process.env.MONGODB_URI}`)
    await client.connect()
    console.log('connected to db')
}

module.exports = {
    connectDB, database
}
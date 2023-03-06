require('dotenv').config();
const {connectDB} = require('./src/mongo')
const {server} = require('./src/server')

const port = process.env.PORT || 8080;
const hostname = process.env.HOSTNAME || "127.0.0.1";

const main = () => {
    connectDB()
    server.listen(port, ()=> {console.log("Server is up on port "+port + ", on ip " +hostname)});
}

main()
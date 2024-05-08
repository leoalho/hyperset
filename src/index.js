require("dotenv").config();
const { connectDB } = require("./mongo");
const { server } = require("./server");

const port = process.env.PORT || 8080;
const hostname = process.env.HOSTNAME || "127.0.0.1";

const main = async () => {
  await connectDB();
  server.listen(port, () => {
    console.log("Server is up on port " + port + ", on ip " + hostname);
  });
};

main();


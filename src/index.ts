import { GameServer } from "./GameServer";

require("dotenv").config();
const connectDB = require("./dbConnect");
const { createServer } = require("./server");

const port = process.env.PORT || "8080";

const main = async () => {
  const db = await connectDB();
  const server = new GameServer(db, "public", port);
};

main();

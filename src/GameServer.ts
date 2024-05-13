import { Db, Io } from "./types";
import { Game } from "./Game";
import http from "http";
import express from "express";
import { Server } from "socket.io";
import { checkSet, randomColor, timer } from "./utils";
import highScoreServices from "./services/highScoreServices";

export class GameServer {
  db: Db;
  games: Game[];
  currentRoomNumber: number;
  server: http.Server;

  constructor(db: Db, publicPath: string, port: string) {
    this.db = db;
    this.games = [];
    this.currentRoomNumber = 0;
    this.server = this.initializeServer(publicPath);

    this.createRoom();

    this.server.listen(port, () => {
      console.log("Server is up on port " + port);
    });
  }

  findRoom() {
    for (let i = 0; i < this.games.length; i++) {
      if (this.games[i].users.length < 19) {
        this.currentRoomNumber = i;
        return;
      }
    }
    this.createRoom();
  }

  createRoom() {
    this.currentRoomNumber = this.games.length;
    const room = "room" + this.currentRoomNumber;
    this.games.push(new Game(room));
    this.games[this.currentRoomNumber].newGame();
  }

  logGameStatus() {
    console.log("GAME STATUS:");
    console.log("------------------------------------------");
    this.games.forEach((e) => {
      console.log(
        e.room + " players: " + e.users.length + " joukkos left: " + e.sets,
      );
    });
    console.log("------------------------------------------");
  }

  initializeServer(publicPath: string) {
    const app = express();
    app.use(express.static(publicPath));

    const server = http.createServer(app);

    const io: Io = new Server(server);
    this.initializeIo(io);

    return server;
  }

  initializeIo(io: Io) {
    io.on("connection", (socket) => {
      console.log(
        socket.id + " connected. Users online: " + io.engine.clientsCount,
      );
      socket.emit("players2", io.engine.clientsCount);
      socket.data.roomNumber = 999;

      socket.on("addUser", async (userName) => {
        this.findRoom();
        socket.join("room" + this.currentRoomNumber);
        socket.data.room = "room" + this.currentRoomNumber;
        socket.data.roomNumber = this.currentRoomNumber;

        socket.data.color = randomColor();
        socket.data.userName = userName;
        const x = Math.floor(Math.random() * 9);
        const y = Math.floor(Math.random() * 9);

        this.games[socket.data.roomNumber!].users.push({
          id: socket.id,
          name: userName,
          color: socket.data.color!,
          corx: x,
          cory: y,
          gamepoints: 0,
          totalpoints: 0,
          created: new Date(),
          roomNumber: this.currentRoomNumber,
        });
        await highScoreServices.addUser(this.db, socket.id, userName);
        console.log("");
        console.log(
          socket.id +
            " started playing as " +
            socket.data.userName +
            " in room " +
            socket.data.room,
        );
        console.log("");
        this.logGameStatus();

        socket.emit(
          "initBoard",
          JSON.stringify(this.games[socket.data.roomNumber!].board),
          socket.id,
          socket.data.color,
          x,
          y,
          JSON.stringify(this.games[socket.data.roomNumber!].users),
        );
        socket.emit("allSets", this.games[socket.data.roomNumber!].sets);

        io.to(socket.data.room!).emit(
          "updatePlayers",
          JSON.stringify(this.games[socket.data.roomNumber!].users),
        );
        const hiScoresToday = await highScoreServices.highscoresToday(
          this.db,
          5,
        );
        const hiScoresAllTime = await highScoreServices.highscoresAllTime(
          this.db,
          5,
        );
        io.emit(
          "updateHighScores",
          JSON.stringify(hiScoresToday),
          JSON.stringify(hiScoresAllTime),
        );
      });
      socket.on("location", (x, y) => {
        for (
          let i = 0;
          i < this.games[socket.data.roomNumber!].users.length;
          i++
        ) {
          if (socket.id == this.games[socket.data.roomNumber!].users[i].id) {
            // var oldx = games[socket.data.roomNumber].users[i].corx;
            // var oldy = games[socket.data.roomNumber].users[i].cory;
            this.games[socket.data.roomNumber!].users[i].corx = x;
            this.games[socket.data.roomNumber!].users[i].cory = y;
            // var diffx = x-oldx;
            // var diffy = y-oldy;
            //io.to(socket.room).emit("playerMoved", socket.id, oldx, oldy, x, y);
            io.to(socket.data.room!).emit(
              "updatePlayers",
              JSON.stringify(this.games[socket.data.roomNumber!].users),
            );

            break;
          }
        }
      });
      socket.on("highscoresToday", async () => {
        const hiscoresToday = await highScoreServices.highscoresToday(
          this.db,
          10,
        );
        socket.emit("highscoresToday", JSON.stringify(hiscoresToday));
      });
      socket.on("highscoresThisMonth", async () => {
        const hiscoresThisMonth = await highScoreServices.highscoresThisMonth(
          this.db,
          10,
        );
        socket.emit("highscoresThisMonth", JSON.stringify(hiscoresThisMonth));
      });
      socket.on("highscoresThisYear", async () => {
        const hiscoresThisYear = await highScoreServices.highscoresThisYear(
          this.db,
          10,
        );
        socket.emit("highscoresThisYear", JSON.stringify(hiscoresThisYear));
      });
      socket.on("highscoresAllTime", async () => {
        const hiScoresAllTime = await highScoreServices.highscoresAllTime(
          this.db,
          10,
        );
        socket.emit("highscoresAllTime", JSON.stringify(hiScoresAllTime));
      });
      socket.on("checkSet", async (cards) => {
        const n = JSON.parse(cards);
        const currentRoom = this.games[socket.data.roomNumber!];
        const card1 = currentRoom.board[n[0][0]][n[0][1]].shape;
        const card2 = currentRoom.board[n[1][0]][n[1][1]].shape;
        const card3 = currentRoom.board[n[2][0]][n[2][1]].shape;
        if (checkSet(card1, card2, card3)) {
          currentRoom.board[n[0][0]][n[0][1]].shape = [3, 3, 3, 3];
          currentRoom.board[n[1][0]][n[1][1]].shape = [3, 3, 3, 3];
          currentRoom.board[n[2][0]][n[2][1]].shape = [3, 3, 3, 3];
          io.to(socket.data.room!).emit(
            "updateBoard",
            JSON.stringify(currentRoom.board),
          );
          currentRoom.sets = currentRoom.gameSets();
          io.to(socket.data.room!).emit("allSets", currentRoom.sets);
          for (let i = 0; i < currentRoom.users.length; i++) {
            if (socket.id == currentRoom.users[i].id) {
              currentRoom.users[i].gamepoints++;
              currentRoom.users[i].totalpoints++;
              await highScoreServices.updatePoints(
                this.db,
                currentRoom.users[i].id,
                currentRoom.users[i].totalpoints,
              );
              break;
            }
          }
          io.to(socket.data.room!).emit(
            "updatePlayers",
            JSON.stringify(currentRoom.users),
          );
          const hiScoresToday = await highScoreServices.highscoresToday(
            this.db,
            5,
          );
          const hiScoresAllTime = await highScoreServices.highscoresAllTime(
            this.db,
            5,
          );
          socket.emit("set", true);
          io.emit(
            "updateHighScores",
            JSON.stringify(hiScoresToday),
            JSON.stringify(hiScoresAllTime),
          );
          console.log("");
          console.log("Joukko found in " + socket.data.room);
          console.log("");
          console.log("GAME STATUS:");
          console.log("------------------------------------------");
          this.games.forEach((e) => {
            console.log(
              e.room +
                " players: " +
                e.users.length +
                " joukkos left: " +
                e.sets,
            );
          });
          console.log("------------------------------------------");

          if (currentRoom.sets == 0) {
            currentRoom.mover = setInterval(timer, 1000, currentRoom);
            return;
          }
          return;
        }
        for (let i = 0; i < currentRoom.users.length; i++) {
          if (socket.id == currentRoom.users[i].id) {
            currentRoom.users[i].gamepoints--;
            currentRoom.users[i].totalpoints--;
            await highScoreServices.updatePoints(
              this.db,
              socket.id,
              currentRoom.users[i].totalpoints,
            );
            break;
          }
        }
        io.to(socket.data.room!).emit(
          "updatePlayers",
          JSON.stringify(this.games[socket.data.roomNumber!].users),
        );
        socket.emit("set", false);
        const hiscoresToday = await highScoreServices.highscoresToday(
          this.db,
          5,
        );
        const hiscoresAllTime = await highScoreServices.highscoresAllTime(
          this.db,
          5,
        );
        io.emit(
          "updateHighScores",
          JSON.stringify(hiscoresToday),
          JSON.stringify(hiscoresAllTime),
        );
      });
      socket.on("disconnect", () => {
        console.log(
          socket.id + " disconnected. Users online: " + io.engine.clientsCount,
        );

        if (socket.data.roomNumber == 999) {
          return;
        }

        for (
          let i = 0;
          i < this.games[socket.data.roomNumber!].users.length;
          i++
        ) {
          if (socket.id == this.games[socket.data.roomNumber!].users[i].id) {
            this.games[socket.data.roomNumber!].users.splice(i, 1);
            io.to(socket.data.room!).emit(
              "updatePlayers",
              JSON.stringify(this.games[socket.data.roomNumber!].users),
            );
            break;
          }
        }
      });
    });
  }
}

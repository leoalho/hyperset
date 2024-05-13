import http from "http";
import express from "express";
import { Server } from "socket.io";
import { randomColor, checkSet, timer } from "./utils";
import { Game } from "./Game";
import highScoreServices from "./services/highScoreServices";
import { Db, Io } from "./types";

var games: Game[] = [];
var roomNumber = 0;
var room = "room" + roomNumber;
games.push(new Game(room));
games[roomNumber].newGame();

function findRoom() {
  for (let i = 0; i < games.length; i++) {
    if (games[i].users.length < 19) {
      roomNumber = i;
      room = "room" + roomNumber;
      return;
    }
  }
  roomNumber = games.length;
  room = "room" + roomNumber;
  games.push(new Game(room));
  games[roomNumber].newGame();
}

const createServer = (db: Db) => {
  const app = express();
  app.use(express.static("public"));
  const server = http.createServer(app);
  const io: Io = new Server(server);
  io.on("connection", (socket) => {
    console.log(
      socket.id + " connected. Users online: " + io.engine.clientsCount,
    );
    socket.emit("players2", io.engine.clientsCount);
    socket.data.roomNumber = 999;

    socket.on("addUser", async (userName) => {
      findRoom();
      socket.join(room);
      socket.data.room = room;
      socket.data.roomNumber = roomNumber;

      socket.data.color = randomColor();
      socket.data.userName = userName;
      const x = Math.floor(Math.random() * 9);
      const y = Math.floor(Math.random() * 9);

      games[socket.data.roomNumber!].users.push({
        id: socket.id,
        name: userName,
        color: socket.data.color!,
        corx: x,
        cory: y,
        gamepoints: 0,
        totalpoints: 0,
        created: new Date(),
        roomNumber: roomNumber,
      });
      await highScoreServices.addUser(db, socket.id, userName);
      console.log("");
      console.log(
        socket.id +
          " started playing as " +
          socket.data.userName +
          " in room " +
          socket.data.room,
      );
      console.log("");
      console.log("GAME STATUS:");
      console.log("------------------------------------------");
      games.forEach((e) => {
        console.log(
          e.room + " players: " + e.users.length + " joukkos left: " + e.sets,
        );
      });
      console.log("------------------------------------------");

      socket.emit(
        "initBoard",
        JSON.stringify(games[socket.data.roomNumber].board),
        socket.id,
        socket.data.color,
        x,
        y,
        JSON.stringify(games[socket.data.roomNumber].users),
      );
      socket.emit("allSets", games[socket.data.roomNumber].sets);

      io.to(socket.data.room).emit(
        "updatePlayers",
        JSON.stringify(games[socket.data.roomNumber].users),
      );
      const hiScoresToday = await highScoreServices.highscoresToday(db, 5);
      const hiScoresAllTime = await highScoreServices.highscoresAllTime(db, 5);
      io.emit(
        "updateHighScores",
        JSON.stringify(hiScoresToday),
        JSON.stringify(hiScoresAllTime),
      );
    });
    socket.on("location", (x, y) => {
      for (let i = 0; i < games[socket.data.roomNumber!].users.length; i++) {
        if (socket.id == games[socket.data.roomNumber!].users[i].id) {
          // var oldx = games[socket.data.roomNumber].users[i].corx;
          // var oldy = games[socket.data.roomNumber].users[i].cory;
          games[socket.data.roomNumber!].users[i].corx = x;
          games[socket.data.roomNumber!].users[i].cory = y;
          // var diffx = x-oldx;
          // var diffy = y-oldy;
          //io.to(socket.room).emit("playerMoved", socket.id, oldx, oldy, x, y);
          io.to(socket.data.room!).emit(
            "updatePlayers",
            JSON.stringify(games[socket.data.roomNumber!].users),
          );

          break;
        }
      }
    });
    socket.on("highscoresToday", async () => {
      const hiscoresToday = await highScoreServices.highscoresToday(db, 10);
      socket.emit("highscoresToday", JSON.stringify(hiscoresToday));
    });
    socket.on("highscoresThisMonth", async () => {
      const hiscoresThisMonth = await highScoreServices.highscoresThisMonth(
        db,
        10,
      );
      socket.emit("highscoresThisMonth", JSON.stringify(hiscoresThisMonth));
    });
    socket.on("highscoresThisYear", async () => {
      const hiscoresThisYear = await highScoreServices.highscoresThisYear(
        db,
        10,
      );
      socket.emit("highscoresThisYear", JSON.stringify(hiscoresThisYear));
    });
    socket.on("highscoresAllTime", async () => {
      const hiScoresAllTime = await highScoreServices.highscoresAllTime(db, 10);
      socket.emit("highscoresAllTime", JSON.stringify(hiScoresAllTime));
    });
    socket.on("checkSet", async (cards) => {
      const n = JSON.parse(cards);
      const currentRoom = games[socket.data.roomNumber!];
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
              db,
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
        const hiScoresToday = await highScoreServices.highscoresToday(db, 5);
        const hiScoresAllTime = await highScoreServices.highscoresAllTime(
          db,
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
        games.forEach((e) => {
          console.log(
            e.room + " players: " + e.users.length + " joukkos left: " + e.sets,
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
            db,
            socket.id,
            currentRoom.users[i].totalpoints,
          );
          break;
        }
      }
      io.to(socket.data.room!).emit(
        "updatePlayers",
        JSON.stringify(games[socket.data.roomNumber!].users),
      );
      socket.emit("set", false);
      const hiscoresToday = await highScoreServices.highscoresToday(db, 5);
      const hiscoresAllTime = await highScoreServices.highscoresAllTime(db, 5);
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

      for (let i = 0; i < games[socket.data.roomNumber!].users.length; i++) {
        if (socket.id == games[socket.data.roomNumber!].users[i].id) {
          games[socket.data.roomNumber!].users.splice(i, 1);
          io.to(socket.data.room!).emit(
            "updatePlayers",
            JSON.stringify(games[socket.data.roomNumber!].users),
          );
          break;
        }
      }
    });
  });

  return server;
};

module.exports = {
  createServer,
};

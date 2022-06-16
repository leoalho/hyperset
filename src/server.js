require('dotenv').config();
const path          = require("path");
const http          = require("http");
const express       = require("express");
const socketIO      = require("socket.io");
const { MongoClient } = require("mongodb");
const {shuffleArray, equalArrays, randomColor, checkSet} = require("./utils.js")
const {game}        = require("./game.js");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const database = client.db('testi');
const highscores = database.collection('highscores');

async function addUser(id, nickname){
    await highscores.insertOne({_id:id, name: nickname, points: 0, startedPlaying: new Date()})
}
async function updatePoints(id, newpoints){
    await highscores.updateOne({_id:id},{ $set: {points: newpoints}})
}
async function highscoresToday(n){
    const top10 = await highscores.aggregate([
                    {"$project": {
                        "name":1,
                        "points":1,
                        "year": {"$year":  "$startedPlaying" },
                        "month":{"$month": "$startedPlaying"},
                        "day":{"$dayOfMonth": "$startedPlaying"},
                        }
                    },{"$match": {
                        "year": new Date().getFullYear(),
                        "month":new Date().getMonth()+1, 
                        "day": new Date().getDate()
                        }
                    },{"$sort":{
                        "points":-1,
                        "startedPlaying":1
                        }
                    },{"$limit":n}]).toArray();
    return top10;
}
async function highscoresThisMonth(n){
    const top10 = await highscores.aggregate([
                    {"$project": {
                        "name":1,
                        "points":1,
                        "year": {"$year":  "$startedPlaying" },
                        "month":{"$month": "$startedPlaying"},
                        "day":{"$dayOfMonth": "$startedPlaying"},
                        }
                    },{"$match": {
                        "year": new Date().getFullYear(),
                        "month":new Date().getMonth()+1, 
                        }
                    },{"$sort":{
                        "points":-1,
                        "startedPlaying":1
                        }
                    },{"$limit":n}]).toArray();
    return top10;
}
async function highscoresThisYear(n){
    const top10 = await highscores.aggregate([
                    {"$project": {
                        "name":1,
                        "points":1,
                        "year": {"$year":  "$startedPlaying" },
                        "month":{"$month": "$startedPlaying"},
                        "day":{"$dayOfMonth": "$startedPlaying"},
                        }
                    },{"$match": {
                        "year": new Date().getFullYear()
                        }
                    },{"$sort":{
                        "points":-1,
                        "startedPlaying":1
                        }
                    },{"$limit":n}]).toArray();
    return top10;
}
async function highscoresAllTime(n){
    const top10 = await highscores.find().sort({points:-1, startedPlaying:1}).limit(n).toArray()
    return top10;
}

function timer(game){
    // a 10 second timer, prints the remaining time every .1s. Reduces a point and clears the board if the time runs out.
    io.to(game.room).emit("gameOver", game.counter);
    game.counter --;
  if (game.counter < 0)
  {
    clearInterval(game.mover);
    game.counter = 10;
    game.newGame();
    io.to(game.room).emit("mayMove");
    io.to(game.room).emit("updateBoard", JSON.stringify(game.board));
    io.to(game.room).emit("updatePlayers", JSON.stringify(game.users));
    io.to(game.room).emit("allSets", game.sets);
  }
}

const publicPath    = path.join(__dirname, "../public");
const port = process.env.PORT || 8080;
const hostname = process.env.HOSTNAME || "127.0.0.1";
let app = express();
let server = http.createServer(app);
let io = socketIO(server);

var games           = [];
var privateGames    = [];
var roomNumber      = 0;
var room = "room"+roomNumber;
games.push(new game(room));
games[roomNumber].newGame();

function findRoom(){
    for (let i=0; i<games.length; i++){
        if ((games[i].users.length)<19){
            roomNumber = i;
            room = "room"+roomNumber;
            return;
        }
    }
    roomNumber = games.length;
    room = "room"+roomNumber;
    games.push(new game(room));
    games[roomNumber].newGame();
}

app.use(express.static(publicPath));

server.listen(port, hostname, ()=> {
    client.connect();
    console.log("Server is up on port "+port + ", on ip " +hostname);
});

io.on("connection", (socket) => {
    console.log(socket.id +" connected. Users online: "+io.engine.clientsCount);
    socket.emit("players2", io.engine.clientsCount);
    socket.roomNumber = 999;

    socket.on("addUser", async (userName)=>{
        findRoom();
        socket.join(room);
        socket.room = room;
        socket.roomNumber = roomNumber;

        socket.color = randomColor();
        socket.userName = userName;
        x = Math.floor(Math.random()*9);
        y = Math.floor(Math.random()*9);

        games[socket.roomNumber].users.push({id:socket.id, name:userName, color:socket.color, corx:x,cory:y, gamepoints:0, totalpoints:0, created: new Date(), roomNumber: roomNumber})
        addUser(socket.id, userName);
        console.log("");
        console.log(socket.id + " started playing as "+ socket.userName + " in room " + socket.room);
        console.log("");
        console.log("GAME STATUS:");
        console.log("------------------------------------------")
        games.forEach(e => {
            console.log(e.room + " players: " + e.users.length + " joukkos left: " + e.sets);
        })
        console.log("------------------------------------------")

        socket.emit("initBoard", JSON.stringify(games[socket.roomNumber].board), socket.id, socket.color, x ,y, JSON.stringify(games[socket.roomNumber].users));
        socket.emit("allSets", games[socket.roomNumber].sets);

        io.to(socket.room).emit("updatePlayers", JSON.stringify(games[socket.roomNumber].users));
        var hiScoresToday = await highscoresToday(5);
        var hiScoresAllTime = await highscoresAllTime(5);
        io.emit("updateHighScores", JSON.stringify(hiScoresToday), JSON.stringify(hiScoresAllTime))
    })
    socket.on("location", (x,y) =>{
        for(let i=0; i<games[socket.roomNumber].users.length;i++){
            if (socket.id==games[socket.roomNumber].users[i].id){
                var oldx = games[socket.roomNumber].users[i].corx;
                var oldy = games[socket.roomNumber].users[i].cory;
                games[socket.roomNumber].users[i].corx = x;
                games[socket.roomNumber].users[i].cory = y;
                var diffx = x-oldx;
                var diffy = y-oldy;
                //io.to(socket.room).emit("playerMoved", socket.id, oldx, oldy, x, y);
                io.to(socket.room).emit("updatePlayers", JSON.stringify(games[socket.roomNumber].users));

                break;
            }
        }
    })
    socket.on("highscoresToday", async () =>{
        var hiscoresToday = await highscoresToday(10);
        socket.emit("highscoresToday", JSON.stringify(hiscoresToday))
    })
    socket.on("highscoresThisMonth", async () =>{
        var hiscoresThisMonth = await highscoresThisMonth(10);
        socket.emit("highscoresThisMonth", JSON.stringify(hiscoresThisMonth))
    })
    socket.on("highscoresThisYear", async () =>{
        var hiscoresThisYear = await highscoresThisYear(10);
        socket.emit("highscoresThisYear", JSON.stringify(hiscoresThisYear))
    })
    socket.on("highscoresAllTime", async () =>{
        var hiScoresAllTime = await highscoresAllTime(10);
        socket.emit("highscoresAllTime", JSON.stringify(hiScoresAllTime))
    })
    socket.on("checkSet", async (cards) =>{
        n = JSON.parse(cards);
        currentRoom = games[socket.roomNumber]
        card1 = currentRoom.board[n[0][0]][n[0][1]].shape;
        card2 = currentRoom.board[n[1][0]][n[1][1]].shape;
        card3 = currentRoom.board[n[2][0]][n[2][1]].shape;
        if (checkSet(card1,card2,card3)){
            currentRoom.board[n[0][0]][n[0][1]].shape = [3,3,3,3];
            currentRoom.board[n[1][0]][n[1][1]].shape = [3,3,3,3];
            currentRoom.board[n[2][0]][n[2][1]].shape = [3,3,3,3];
            io.to(socket.room).emit("updateBoard", JSON.stringify(currentRoom.board));
            currentRoom.sets = currentRoom.gameSets();
            io.to(socket.room).emit("allSets", currentRoom.sets);
            for(let i=0; i<currentRoom.users.length;i++){
                if (socket.id==currentRoom.users[i].id){
                    currentRoom.users[i].gamepoints ++;
                    currentRoom.users[i].totalpoints ++;
                    updatePoints(currentRoom.users[i].id,currentRoom.users[i].totalpoints);
                    break;
                }
            }
            io.to(socket.room).emit("updatePlayers", JSON.stringify(currentRoom.users));
            var hiScoresToday = await highscoresToday(5);
            var hiScoresAllTime = await highscoresAllTime(5);
            socket.emit("set", true);
            io.emit("updateHighScores", JSON.stringify(hiScoresToday), JSON.stringify(hiScoresAllTime))
            console.log("");
            console.log("Joukko found in "+socket.room);
            console.log("");
            console.log("GAME STATUS:")
            console.log("------------------------------------------")
            games.forEach(e => {
                console.log(e.room + " players: " + e.users.length + " joukkos left: " + e.sets);
            })
            console.log("------------------------------------------")

            if (currentRoom.sets == 0){
                currentRoom.mover = setInterval(timer,1000,currentRoom);
                return;}
            return;
        }
        for(let i=0; i<currentRoom.users.length;i++){
            if (socket.id==currentRoom.users[i].id){
                currentRoom.users[i].gamepoints --;
                currentRoom.users[i].totalpoints --;
                updatePoints(socket.id, currentRoom.users[i].totalpoints);
                break;
            }
        }
        io.to(socket.room).emit("updatePlayers", JSON.stringify(games[socket.roomNumber].users));
        socket.emit("set", false);
        var hiscoresToday = await highscoresToday(5);
        var hiscoresAllTime = await highscoresAllTime(5);
        io.emit("updateHighScores", JSON.stringify(hiscoresToday), JSON.stringify(hiscoresAllTime))
    })
    socket.on("disconnect", () => {
        console.log(socket.id +" disconnected. Users online: "+ io.engine.clientsCount)
        
        if (socket.roomNumber == 999){
            return;
        }

        for(let i=0; i<games[socket.roomNumber].users.length;i++){
            if (socket.id==games[socket.roomNumber].users[i].id){
                games[socket.roomNumber].users.splice(i,1);
                io.to(socket.room).emit("updatePlayers", JSON.stringify(games[socket.roomNumber].users));
                break;
            }
        }
    })
});

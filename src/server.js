const http          = require("http");
const express       = require("express");
const socketIO      = require("socket.io");
const { randomColor, checkSet, timer} = require("./utils.js")
const {game}        = require("./game.js");
const highScoreServices = require("./services/highScoreServices")

var games           = [];
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

const createServer = (db) => {
    let app = express();
    app.use(express.static('public'));

    let server = http.createServer(app);
    let io = socketIO(server);

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
        await highScoreServices.addUser(db, socket.id, userName);
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
        var hiScoresToday = await highScoreServices.highscoresToday(db, 5);
        var hiScoresAllTime = await highScoreServices.highscoresAllTime(db, 5);
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
        const hiscoresToday = await highScoreServices.highscoresToday(db, 10);
        socket.emit("highscoresToday", JSON.stringify(hiscoresToday))
    })
    socket.on("highscoresThisMonth", async () =>{
        const hiscoresThisMonth = await highScoreServices.highscoresThisMonth(db,10);
        socket.emit("highscoresThisMonth", JSON.stringify(hiscoresThisMonth))
    })
    socket.on("highscoresThisYear", async () =>{
        const hiscoresThisYear = await highScoreServices.highscoresThisYear(db,10);
        socket.emit("highscoresThisYear", JSON.stringify(hiscoresThisYear))
    })
    socket.on("highscoresAllTime", async () =>{
        const hiScoresAllTime = await highScoreServices.highscoresAllTime(db,10);
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
                    await highScoreServices.updatePoints(db, currentRoom.users[i].id,currentRoom.users[i].totalpoints);
                    break;
                }
            }
            io.to(socket.room).emit("updatePlayers", JSON.stringify(currentRoom.users));
            var hiScoresToday = await highScoreServices.highscoresToday(db, 5);
            var hiScoresAllTime = await highScoreServices.highscoresAllTime(db, 5);
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
                await highScoreServices.updatePoints(db, socket.id, currentRoom.users[i].totalpoints);
                break;
            }
        }
        io.to(socket.room).emit("updatePlayers", JSON.stringify(games[socket.roomNumber].users));
        socket.emit("set", false);
        var hiscoresToday = await highScoreServices.highscoresToday(db,5);
        var hiscoresAllTime = await highScoreServices.highscoresAllTime(db, 5);
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
})

    return server
};

module.exports = {
    createServer
}
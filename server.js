const path          = require("path");
const http          = require("http");
const express       = require("express");
const socketIO      = require("socket.io");
const { MongoClient } = require("mongodb");
const {shuffleArray, equalArrays, randomColor} = require("./utils.js")

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const database = client.db('testi');
const highscores = database.collection('highscores');

const locations = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]];
var online          = 0;

class game{
	constructor(room){
		this.users = [];
		this.deck = [];
		this.board = [[],[],[],[],[],[],[],[],[]];
		this.cardsChosen = [];  
	    this.sets            = 0; 
	    this.setsfound       = [];
	    this.mover; //used for animation
	    this.counter = 10; //used for animation
        this.room = room;
	}
    iterateView(x,y){
        for (let i=0;i<9;i++){
            for (let j=i+1; j<9; j++){
                for (let k=j+1; k<9; k++){
                    var card1 = this.board[(x+locations[i][0]+9)%9][(y+locations[i][1]+9)%9].shape;
                    var card2 = this.board[(x+locations[j][0]+9)%9][(y+locations[j][1]+9)%9].shape;
                    var card3 = this.board[(x+locations[k][0]+9)%9][(y+locations[k][1]+9)%9].shape;
                    if (checkSet(card1,card2,card3)){
                        var set = [[(x+locations[i][0]+9)%9,(y+locations[i][1]+9)%9],[(x+locations[j][0]+9)%9,(y+locations[j][1]+9)%9],[(x+locations[k][0]+9)%9,(y+locations[k][1]+9)%9]]
                        set.sort()
                        if (this.setsfound.length==0){
                            this.setsfound.push(set)
                        }
                        var n=0
                        for (let l = 0; l<this.setsfound.length; l++){
                            if(!equalArrays(set[0],this.setsfound[l][0]) && !equalArrays(set[1],this.setsfound[l][1]) && !equalArrays(set[2],this.setsfound[l][2])){
                            n++;
                            }
                        }
                        if (n==this.setsfound.length){
                            this.setsfound.push(set);
                            this.setsfound.sort();
                        }
                    }
                }
            }
        }
    }
    iterateField(){
        for (let i = 0; i<9; i++){
            for (let j=0; j<9; j++){
                var card = this.board[j][i].shape
                this.iterateView(j,i);
            }
        }
    }
    gameSets(){
        this.setsfound = [];
        this.iterateField();
        return this.setsfound.length;
    }
    createDeck(){
        // creates a 81-card (3^4) shuffled deck with 4 different attributes, each having 3 values.
        for (let i=0; i<3; i++){
            for (let j=0; j<3; j++){
                for (let k=0; k<3; k++){
                    for (let l=0; l<3; l++){
                        this.deck.push([i,j,k,l]);
                    }
                }
            }
        }
    }
    createBoard(){
        this.board = [[],[],[],[],[],[],[],[],[]];
        var n = 0;
        for(let i = 0; i<9;i++){
            for (let j=0; j<9;j++){
                this.board[i].push({shape: this.deck[n]})
                n++;
            }
        }
    }
    newGame(){
        this.deck            = [];
        this.board           = [[],[],[],[],[],[],[],[],[]];
        this.cardsChosen     = [];  
        this.setsfound       = [];
        this.createDeck();
        shuffleArray(this.deck);
        this.createBoard(this);
        this.sets = this.gameSets();
        for (let i=0; i<this.users.length; i++){
            this.users[i].gamepoints = 0;
        }
    }
    timer(){
        // a 10 second timer, prints the remaining time every .1s. Reduces a point and clears the board if the time runs out.
        io.to(this.room).emit("gameOver", this.counter);
        this.counter --;
      if (this.counter < 0)
      {
        clearInterval(this.mover);
        this.counter = 10;
        this.newGame();
        io.to(this.room).emit("mayMove");
        io.to(this.room).emit("updateBoard", JSON.stringify(this.board));
        io.to(this.room).emit("updatePlayers", JSON.stringify(this.users));
        io.to(this.room).emit("allSets", this.sets);
      }
    }
}

function checkSet(card1,card2,card3){
    // Returns true if the elements form a set and false if not.
    if (card1[0]==3 || card2[0]==3 || card3[0]==3){ return false}
    numbersMatch = (card1[0]+card2[0]+card3[0])%3;
    colorsMatch = (card1[1]+card2[1]+card3[1])%3;
    fillsMatch = (card1[2]+card2[2]+card3[2])%3;
    shapesMatch = (card1[3]+card2[3]+card3[3])%3;
    if (numbersMatch + colorsMatch + fillsMatch + shapesMatch == 0){
        return true;
    }
    return false;
}

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


const publicPath    = path.join(__dirname, "/public");
const port          = 3000;
const hostname      = "192.168.0.3";
let app             = express();
let server          = http.createServer(app);
let io              = socketIO(server);


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
    console.log("Server is up on ip "+hostname+" port "+port);
});

io.on("connection", (socket) => {
    console.log(socket.id +" connected. Users online: "+io.engine.clientsCount);
    socket.emit("players2", io.engine.clientsCount);

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
                games[socket.roomNumber].users[i].corx = x;
                games[socket.roomNumber].users[i].cory = y;
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
            if (currentRoom.sets == 0){
                currentRoom.mover = setInterval(currentRoom.timer,1000);
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
        
        if (io.engine.clientsCount==0){
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

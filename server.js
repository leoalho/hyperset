const path          = require("path");
const http          = require("http");
const express       = require("express");
const socketIO      = require("socket.io");
const { MongoClient } = require("mongodb");
const { set } = require("express/lib/application");
const { equal } = require("assert");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const database = client.db('testi');
const highscores = database.collection('highscores');

var online          = 0;
var users           = [];
var deck            = [];
var board           = [[],[],[],[],[],[],[],[],[]];
cardsChosen         = [];  
var sets            = 0; 
var setsfound       = [];

locations = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]];

var mover; //used for animation
var counter = 10; //used for animation

const shuffleArray = array => {
    // function for shuffling arrays
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
}
function equalArrays(a,b){
    for (var i = 0; i < a.length; ++i) {
        if (a[i] != b[i]) return false;
      }
      return true;
}
function equalSets(a,b){
    return (equalArrays(a[1],b[1]) && equalArrays(a[0],b[0]) && equalArrays(b[2],a[2]))
}
function timer(){
    // a 10 second timer, prints the remaining time every .1s. Reduces a point and clears the board if the time runs out.
    io.emit("gameOver", counter);
    counter --;
  if (counter < 0)
  {
    clearInterval(mover);
    counter = 10;
    newGame();
    io.emit("updateBoard", JSON.stringify(board));
    io.emit("updatePlayers", JSON.stringify(users));
    io.emit("allSets", sets);
  }
}
function createDeck(){
    // creates a 81-card (3^4) shuffled deck with 4 different attributes, each having 3 values.
    n = 0;
    for (let i=0; i<3; i++){
        for (let j=0; j<3; j++){
            for (let k=0; k<3; k++){
                for (let l=0; l<3; l++){
                    deck.push([i,j,k,l]);
                }
            }
        }
    }
}
function createBoard(){
    board = [[],[],[],[],[],[],[],[],[]];
    n = 0;
    for(let i = 0; i<9;i++){
        for (let j=0; j<9;j++){
            board[i].push({shape: deck[n]})
            n++;
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
function checkSetLocal(card1,card2,card3){
    // Returns true if the elements form a set and false if not.
    if (card1[0]==3 || card2[0]==3 || card3[0]==3){ return false}
    numbersMatch = (card1[0]+card2[0]+card3[0])%3;
    colorsMatch = (card1[1]+card2[1]+card3[1])%3;
    fillsMatch = (card1[2]+card2[2]+card3[2])%3;
    shapesMatch = (card1[3]+card2[3]+card3[3])%3;
    if (numbersMatch + colorsMatch + fillsMatch + shapesMatch == 0){
        return true;
    }
}
function iterateField(){
    for (let i = 0; i<9; i++){
        for (let j=0; j<9; j++){
            var card = board[j][i].shape
            iterateView(j,i);
        }
    }
    console.table(setsfound)

}
function iterateView(x,y){
    for (let i=0;i<9;i++){
        for (let j=i+1; j<9; j++){
            for (let k=j+1; k<9; k++){
                card1 = board[(x+locations[i][0]+9)%9][(y+locations[i][1]+9)%9].shape;
                card2 = board[(x+locations[j][0]+9)%9][(y+locations[j][1]+9)%9].shape;
                card3 = board[(x+locations[k][0]+9)%9][(y+locations[k][1]+9)%9].shape;
                if (checkSetLocal(card1,card2,card3)){
                    var set = [[(x+locations[i][0]+9)%9,(y+locations[i][1]+9)%9],[(x+locations[j][0]+9)%9,(y+locations[j][1]+9)%9],[(x+locations[k][0]+9)%9,(y+locations[k][1]+9)%9]]
                    set.sort()
                    if (setsfound.length==0){
                        setsfound.push(set)
                    }
                    var n=0
                    for (let l = 0; l<setsfound.length; l++){
                        if(!equalArrays(set[0],setsfound[l][0]) && !equalArrays(set[1],setsfound[l][1]) && !equalArrays(set[2],setsfound[l][2])){
                        n++;
                        }
                    }
                    if (n==setsfound.length){
                        setsfound.push(set);
                        setsfound.sort();
                    }
                }
            }
        }
    }
}
function gameSets(){
    setsfound = [];
    setsfound2 = [];
    iterateField();
    return setsfound.length;
}
function checkPlane(card1,card2,card3,card4){
    //checks wether the cardsChosen cards form a plane
    if (equalArrays(findThird(card1,card2),findThird(card3,card4))){
		return true;
	}
	if (equalArrays(findThird(card1,card3),findThird(card2,card4))){
		return true;
    }
	if (equalArrays(findThird(card1,card4),findThird(card2,card3))){
		return true;
	}
	return false;
}
function findThird(card1, card2){
	var card3 = [0,0,0,0];
	for (let i=0; i<4; i++){
		card3[i]=(6-card1[i]-card2[i])%3;
	}
	return card3;
}
function newGame(){
    deck            = [];
    board           = [[],[],[],[],[],[],[],[],[]];
    cardsChosen     = [];  
    setsfound       = [];
    createDeck();
    shuffleArray(deck);
    createBoard();
    io.emit("mayMove");
    sets = gameSets();
    for (let i=0; i<users.length; i++){
        users[i].gamepoints = 0;
    }
}
async function addUser(id, nickname){
    //client.connect();
    await highscores.insertOne({_id:id, name: nickname, points: 0, startedPlaying: new Date()})
    //client.close();
}
async function updatePoints(id, newpoints){
    //client.connect();
    await highscores.updateOne({_id:id},{ $set: {points: newpoints}})
    //client.close();
}
async function highscoresToday(n){
    //client.connect();
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
    //client.close()
    return top10;
}
async function highscoresThisMonth(n){
    //client.connect();
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
    //client.close()
    return top10;
}
async function highscoresThisYear(n){
    //client.connect();
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
    //client.close()
    return top10;
}
async function highscoresAllTime(n){
    //client.connect();
    const top10 = await highscores.find().sort({points:-1, startedPlaying:1}).limit(n).toArray()
    //client.close();
    return top10;
} 

const publicPath    = path.join(__dirname, "/public");
const port          = 3000;
const hostname      = "192.168.0.3";
let app             = express();
let server          = http.createServer(app);
let io              = socketIO(server);

app.use(express.static(publicPath));

server.listen(port, hostname, ()=> {
    client.connect();
    newGame();
    console.log("Server is up on ip "+hostname+" port "+port);

});

io.on("connection", (socket) => {
    console.log(socket.id +" connected. Users online: "+io.engine.clientsCount);
    socket.emit("players", JSON.stringify(users));
    
    socket.on("location", (x,y) =>{
        for(let i=0; i<users.length;i++){
            if (socket.id==users[i].id){
                users[i].corx = x;
                users[i].cory = y;
                io.emit("updatePlayers", JSON.stringify(users));
                break;
            }
        }
    })
    socket.on("addUser", async (userName)=>{
        randomColor = Math.floor(Math.random()*16777215).toString(16);
        socket.color = "#" + randomColor;
        socket.userName = userName
        x = Math.floor(Math.random()*9);
        y = Math.floor(Math.random()*9);
        users.push({id:socket.id, name:userName, color:socket.color, corx:x,cory:y, gamepoints:0, totalpoints:0, created: new Date()})
        addUser(socket.id, userName);
        socket.emit("initBoard", JSON.stringify(board), socket.id, socket.color, x ,y, JSON.stringify(users));
        socket.emit("allSets", sets);
        io.emit("updatePlayers", JSON.stringify(users));
        var hiScoresToday = await highscoresToday(5);
        var hiScoresAllTime = await highscoresAllTime(5);
        io.emit("updateHighScores", JSON.stringify(hiScoresToday), JSON.stringify(hiScoresAllTime))
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
        card1 = board[n[0][0]][n[0][1]].shape;
        card2 = board[n[1][0]][n[1][1]].shape;
        card3 = board[n[2][0]][n[2][1]].shape;
        if (checkSet(card1,card2,card3)){
            board[n[0][0]][n[0][1]].shape = [3,3,3,3];
            board[n[1][0]][n[1][1]].shape = [3,3,3,3];
            board[n[2][0]][n[2][1]].shape = [3,3,3,3];
            io.emit("updateBoard", JSON.stringify(board));
            sets = gameSets();
            io.emit("allSets", sets);
            for(let i=0; i<users.length;i++){
                if (socket.id==users[i].id){
                    users[i].gamepoints ++;
                    users[i].totalpoints ++;
                    updatePoints(users[i].id,users[i].totalpoints);
                    break;
                }
            }
            io.emit("updatePlayers", JSON.stringify(users));
            var hiScoresToday = await highscoresToday(5);
            var hiScoresAllTime = await highscoresAllTime(5);
            socket.emit("set", true);
            io.emit("updateHighScores", JSON.stringify(hiScoresToday), JSON.stringify(hiScoresAllTime))
            if (sets == 0){
                mover = setInterval(timer,1000);
                return;}
            return;
        }
        for(let i=0; i<users.length;i++){
            if (socket.id==users[i].id){
                users[i].gamepoints --;
                users[i].totalpoints --;
                updatePoints(socket.id,users[i].totalpoints);
                break;
            }
        }
        io.emit("updatePlayers", JSON.stringify(users));
        socket.emit("set", false);
        var hiscoresToday = await highscoresToday(5);
        var hiscoresAllTime = await highscoresAllTime(5);
        io.emit("updateHighScores", JSON.stringify(hiscoresToday), JSON.stringify(hiscoresAllTime))
    })
    socket.on("disconnect", () => {
        console.log(socket.id +" disconnected. Users online: "+ io.engine.clientsCount)
        console.table(users);
        for(let i=0; i<users.length;i++){
            if (socket.id==users[i].id){
                users.splice(i,1);
                io.emit("updatePlayers", JSON.stringify(users));
                break;
            }
        }
    })
});
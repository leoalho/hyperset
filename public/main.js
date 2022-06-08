import {createLeftButton,createRightButton,createDownButton,createUpButton,buttonClick, createArrows} from "./buttons.js";
import {$, equalArrays, randomColor, shuffleArray, comparePoints} from "./utils.js"
import {Area} from "./board.js";
import {player} from "./player.js";

var socket = io();

var canvas = $("myCanvas");
canvas.width = Math.min(document.documentElement.clientWidth, 600);
canvas.height = canvas.width;

var canvas2 = $("canvas2");
var ctx2 = canvas2.getContext("2d");
canvas2.width = 200;
canvas2.height = 200;

var area = new Area(canvas);

var players; //list of players
var mover; //used for animation
var counter = 10; //used for animation

var highscoresToday = [];
var highscoresThisMonth = [];
var highscoresThisYear = [];
var highscoresAllTime = [];
var arrowButtons = [];

const click = new Audio("sounds/click.mp3");
const fail = new Audio("sounds/fail.mp3");
const success = new Audio("sounds/success.mp3");
const sounds = [click, fail, success];

function drawArrows(){
    arrowButtons.forEach(element => {
        ctx2.fillStyle = player.color;
        ctx2.fill(element);
        ctx2.stroke(element);
    });
}

arrowButtons = createArrows(45);
drawArrows();
canvas2.addEventListener("click", buttonClick); 

function colorCard(i){ 
    var x = player.position[0]+i%5-2;
    x = (x+9)%9;
    var y = player.position[1]+Math.floor(i/5)-2;
    y = (y+9)%9;
    var coord = [x,y]
    if (area.board[x][y].shape[0]==3){return;}
    if (area.cards[i].color=="black"){
        player.cardsChosen.push([x,y]);
        area.cards[i].color=player.color;
    }else{
        area.cards[i].color="black";
        for (let j=0; j<player.cardsChosen.length; j++){
            if (equalArrays([x,y],player.cardsChosen[j])){
                player.cardsChosen.splice(j,1);
            }
        }
    }
}
function move(movex,movey,posx,posy){
    area.ctx.save();
    player.x += movex;
    player.y += movey;
    area.ctx.clearRect(area.clearance+area.size*2, area.clearance*1+area.size*2, area.width, area.height);
    area.ctx.translate(-player.x,-player.y);
    area.drawBoard();
    area.drawAllPlayers(players);
    area.ctx.restore();
    area.drawYou();
    counter--;
    if (counter == 0){
        counter = 10;
        clearInterval(mover);

        player.x = 0;
        player.y = 0;
        player.moving = false;
        player.position[0] =(player.position[0]+posx+9)%9;
        player.position[1] =(player.position[1]+posy+9)%9;

        area.drawBoard();
        area.drawAllPlayers(players);
        area.drawYou(); 
        area.boardSets();

        socket.emit("location", player.position[0], player.position[1]);
        $("coordinate").innerText = "Your position: "+player.position;
       
    }    
}
function checkSet(){
    if (player.cardsChosen.length==3){
        socket.emit("checkSet",JSON.stringify(player.cardsChosen));
        area.resetColors();
        player.cardsChosen = [];
    }
}

function cursorLocation(e){
    //changes the color of the card clicked adds or removes that card to the cardsChosen Array
    let rect = canvas.getBoundingClientRect();
    let corx = e.clientX - rect.left;
    let cory = e.clientY - rect.top;
    for (let i=0; i<24; i++){
            if (area.ctx.isPointInPath(area.cards[i].form, corx, cory)) {
                colorCard(i);
                area.drawAll(players);
                click.play();
                checkSet();
            }
            /*
            if (corx>cards[i].x && corx<(cards[i].x+size*2)
            && cory>cards[i].y-size && cory<(cards[i].y+size)){
                colorCard(i+6);
                click.play();
                drawAll();
                checkSet();
            }
            */
    }
}
function drawPoints(){

    var playerPoints = "<p><u>Your points</u><br>This game: "+player.points+"<br> In total: "+player.pointsTotal+ "</p><p><u>Top 5 players<br> This round: </u><br>";
    players.sort(comparePoints);
    for (let i=0; i<Math.min(5,players.length); i++){
        playerPoints += players[i].name+": "+players[i].gamepoints+", <br>";
    }
    playerPoints += "<u>Today:</u><br>";
    for (let i=0; i<highscoresToday.length; i++){
        playerPoints += highscoresToday[i].name+": "+highscoresToday[i].points+", <br>";
    }
    playerPoints += "<u>All time:</u><br>";
    for (let i=0; i<highscoresAllTime.length; i++){
        playerPoints += highscoresAllTime[i].name+": "+highscoresAllTime[i].points+", <br>";
    }
    playerPoints += "</p>";
    $("points").innerHTML = playerPoints;
}
canvas.addEventListener("keydown", function(event){
    
    if (event.code==="ArrowDown" && !player.moving){
        player.moving=true;
        area.resetColors();
        player.cardsChosen = [];
        mover = setInterval(()=>{
            move(0,area.movement,0,1);
        },50)
    }
    if (event.code==="ArrowUp" && !player.moving){
        player.moving=true;
        area.resetColors();
        player.cardsChosen = [];
        mover = setInterval(()=>{
            move(0,-area.movement,0,-1);
        },50)
    }
    if (event.code==="ArrowLeft" && !player.moving){
        player.moving=true;
        area.resetColors();
        player.cardsChosen = [];
        mover = setInterval(()=>{
            move(-area.movement,0,-1,0);
        },50)
    }
    if (event.code==="ArrowRight" && !player.moving){
        player.moving=true;
        area.resetColors();
        player.cardsChosen = [];
        mover = setInterval(()=>{
            move(area.movement,0,1,0);
        },50);
    }
})
canvas.addEventListener("click", cursorLocation);

$("usernameInput").addEventListener("keydown", function(event){
    if (event.key === "Enter"){
        if (!socket.connected){
            alert("Server not online :(")
            $("usernameInput").value = "";
            return;
        }
        var nickname = $("usernameInput").value;
        if (nickname.length>20){
            alert("Please choose a shorter username (<20 charaacters)")
            $("usernameInput").value = "";
            return;
        }
        if (nickname.length==0){
            return;
        }
        socket.emit("addUser", nickname);
        $("login").style.display="none";
        $("game").style.display="grid";
        $("usernameInput").value = "";
    }
})
$("mute").addEventListener("click", () =>{
    for (let i=0; i<sounds.length; i++){
        sounds[i].muted = true;
    }
    $("unmute").style.display="inline";
    $("mute").style.display="none";
    canvas.focus();
})
$("unmute").addEventListener("click", ()=>{
    for (let i=0; i<sounds.length; i++){
        sounds[i].muted = false;
    }
    $("mute").style.display="inline";
    $("unmute").style.display="none";
    canvas.focus();
})
$("about").addEventListener("click", () =>{
    $("info").style.display="block";
})
$("about2").addEventListener("click", () =>{
    $("info").style.display="block";
})
$("hint").addEventListener("click", () =>{
    area.displayText(area.boardSets(), players);
    setTimeout(() => {area.drawAll(players);},  1000);
    player.hints --;
    $("hints").innerText = "Hints left: "+player.hints;
    if (hints==0){
        $("hint").disabled = true;
    }
    canvas.focus();

})
$("infoClose").addEventListener("click", () =>{
    $("info").style.display="none";
    canvas.focus();
})
$("highScoreButton").addEventListener("click", ()=>{
    $("highscorePopup").style.display="block";
    socket.emit("highscoresAllTime")
})
$("today").addEventListener("click", ()=>{
    socket.emit("highscoresToday");
})
$("month").addEventListener("click", ()=>{
    socket.emit("highscoresThisMonth");
})
$("year").addEventListener("click",()=>{
    socket.emit("highscoresThisYear");
})
$("allTime").addEventListener("click", ()=>{
    socket.emit("highscoresAllTime");
})
$("highscoreClose").addEventListener("click", ()=>{
    $("highscorePopup").style.display="none";
})

socket.on("initBoard", (serverBoard, socketid, color, x, y, users)=>{
    area.board = JSON.parse(serverBoard);
    players = JSON.parse(users);
    player.id = socketid;
    player.position[0]=x;
    player.position[1]=y;
    player.color = color;
    area.ctx.translate(-area.clearance-area.size*2, -area.clearance-area.size*2);
    area.boardSets();
    area.drawBoard();
    area.drawAllPlayers(players); 
    area.drawYou();
    drawPoints(); 
    $("coordinate").innerText = "Your position: "+player.position;
    $("hints").innerText = "Hints left: "+player.hints;
    canvas.focus();

})
socket.on("players", (users)=>{
    players = JSON.parse(users);
    $("players").innerText="Players online: "+players.length;
})
socket.on("players2", (users)=>{
    $("players").innerText="Players online: "+users;
})
socket.on("updatePlayers", (users) =>{
    players = JSON.parse(users);
//    $("players").innerText="Players online: "+players.length;
    area.drawBoard();
    drawArrows(); 
    area.drawAllPlayers(players); 
    area.drawYou();
    drawPoints();
})
socket.on("updateBoard", (newBoard)=>{
    area.board = JSON.parse(newBoard);
    area.drawBoard(); 
    area.drawAllPlayers(players); 
    area.drawYou();
    area.boardSets();
})
socket.on("set", (set) =>{
    if (set){
        area.displayText("SUCCESS!", players)
        setTimeout(() => {area.drawAll(players);},  1000);
        success.play();
        player.hints ++;
        player.points ++;
        player.pointsTotal ++;
        $("hints").innerText = "Hints left: "+player.hints;
        $("hint").disabled = false;
        return;
    }
    area.displayText("FAIL!", players)
    setTimeout(() => {area.drawAll(players);},  1000);
    fail.play();
    player.points --;
    player.pointsTotal --;
})
socket.on("allSets", (sets) =>{
    $("allSets").innerText = "Collections left: " +sets;
})
socket.on("gameOver", (timeLeft) =>{
    player.points = 0;
    player.moving = true;
    area.gameOver(timeLeft, players);
})
socket.on("mayMove",()=>{
    player.moving = false;
})
socket.on("updateHighScores",(newScoresToday,newScoresAllTime)=>{
    highscoresToday = JSON.parse(newScoresToday);
    highscoresAllTime = JSON.parse(newScoresAllTime);
    drawPoints();
})
socket.on("highscoresAllTime",(newScoresAllTime)=>{
    highscoresAllTime = JSON.parse(newScoresAllTime);
    var highscoreText = "Highscores alltime:<br>";
    for (var i=0;i<highscoresAllTime.length;i++){
        highscoreText += i+1+": "+highscoresAllTime[i].name+": "+highscoresAllTime[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresToday", (newScoresToday)=>{
    highscoresToday = JSON.parse(newScoresToday);
    var highscoreText = "Highscores today:<br>";
    for (var i=0;i<highscoresToday.length;i++){
        highscoreText += i+1+": "+highscoresToday[i].name+": "+highscoresToday[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresThisMonth", (newScoresToday)=>{
    highscoresThisMonth = JSON.parse(newScoresToday);
    var highscoreText = "Highscores this month:<br>";
    for (var i=0;i<highscoresThisMonth.length;i++){
        highscoreText += i+1+": "+highscoresThisMonth[i].name+": "+highscoresThisMonth[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresThisYear", (newScoresToday)=>{
    highscoresThisYear = JSON.parse(newScoresToday);
    var highscoreText = "Highscores this year:<br>";
    for (var i=0;i<highscoresThisYear.length;i++){
        highscoreText += i+1+": "+highscoresThisYear[i].name+": "+highscoresThisYear[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
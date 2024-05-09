import {arrowarea} from "./buttons.js";
import {$, equalArrays, randomColor, shuffleArray, comparePoints} from "./utils.js"
import {Area} from "./board.js";
import {player} from "./player.js";
import {containsProfanity} from "./filter.js";

var socket = io();

var area = new Area();
var area2;

var players; //list of players
var mover; //used for animation
var counter = 10; //used for animation

var highscoresToday = [];
var highscoresThisMonth = [];
var highscoresThisYear = [];
var highscoresAllTime = [];

const click = new Audio("sounds/click.mp3");
const fail = new Audio("sounds/fail.mp3");
const success = new Audio("sounds/success.mp3");
const sounds = [click, fail, success];

function move(movex,movey,posx,posy){
    player.x += movex;
    player.y += movey;
    area.move(players);
    counter--;
    if (counter == 0){
        counter = 10;
        clearInterval(mover);

        player.x = 0;
        player.y = 0;
        player.moving = false;
        player.position[0] =(player.position[0]+posx+9)%9;
        player.position[1] =(player.position[1]+posy+9)%9;

        area.drawAll(players);
        area.boardSets();

        socket.emit("location", player.position[0], player.position[1]);
        $("coordinate").innerText = "Your position: "+player.position;       
    }    
}
function moveOther(diffx, diffy, otherColor, index){
    area.drawBoard();
    area.drawPlayer(area.cards[index].x+area.size+diffx, area.cards[index].y+diffy, otherColor);
    area.drawYou();
    counter--;
    if (counter == 0){
        counter = 10;
        clearInterval(mover);
    }
}
function movePlayer(id, oldx, oldy, x, y, index){
    counter = 10;
    var diffx = oldx-x;
    var diffy = oldy-y;
    var otherColor;
    for (var i; i<players.length; i++){
        if (id==players[i]){
            otherColor = players[i].color;
        }
    }
    mover = setInterval(()=>{moveOther(diffx, diffy, otherColor, index)},50);
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
    let rect = area.canvas.getBoundingClientRect();
    let corx = e.clientX - rect.left;
    let cory = e.clientY - rect.top;
    for (let i=0; i<24; i++){
        if (area.ctx.isPointInPath(area.cards[i].form, corx, cory)) {
            area.colorCard(i);
            area.drawAll(players);
            click.play();
            checkSet();
        }
    }
}
function drawPoints(){
    var playerPoints = "<p><u>Your points</u><br>This game: "+player.points+"<br> In total: "+player.pointsTotal+ "</p><p><u>Top 5 players<br> This round: </u><br>";
    players.sort(comparePoints);
    for (let i=0; i<Math.min(5,players.length); i++){
        playerPoints += players[i].username+": "+players[i].gamepoints+", <br>";
    }
    playerPoints += "<u>Today:</u><br>";
    for (let i=0; i<highscoresToday.length; i++){
        playerPoints += highscoresToday[i].username+": "+highscoresToday[i].score+", <br>";
    }
    playerPoints += "<u>All time:</u><br>";
    for (let i=0; i<highscoresAllTime.length; i++){
        playerPoints += highscoresAllTime[i].username+": "+highscoresAllTime[i].score+", <br>";
    }
    playerPoints += "</p>";
    $("points").innerHTML = playerPoints;
}
function moveUp(){
    player.moving=true;
    area.resetColors();
    player.cardsChosen = [];
    mover = setInterval(()=>{
        move(0,-area.movement,0,-1);
    },50)
}
function moveDown(){
    player.moving=true;
    area.resetColors();
    player.cardsChosen = [];
    mover = setInterval(()=>{
        move(0,area.movement,0,1);
    },50)
}
function moveLeft(){
    player.moving=true;
    area.resetColors();
    player.cardsChosen = [];
    mover = setInterval(()=>{
        move(-area.movement,0,-1,0);
    },50)
}
function moveRight(){
    player.moving=true;
    area.resetColors();
    player.cardsChosen = [];
    mover = setInterval(()=>{
        move(area.movement,0,1,0);
    },50);
}
area.canvas.addEventListener("keydown", function(event){
    if (event.code==="ArrowDown" && !player.moving){
        moveDown();
    }
    if (event.code==="ArrowUp" && !player.moving){
        moveUp();
    }
    if (event.code==="ArrowLeft" && !player.moving){
        moveLeft();
    }
    if (event.code==="ArrowRight" && !player.moving){
        moveRight();
    }
})
area.canvas.addEventListener("click", cursorLocation);

function buttonClick(e){
    let rect = area2.canvas.getBoundingClientRect();
    let corx = e.clientX - rect.left;
    let cory = e.clientY - rect.top;
    if (!player.moving){
        if (area2.ctx.isPointInPath(area2.arrows[0], corx, cory)) {
            moveDown();         
        }
        if (area2.ctx.isPointInPath(area2.arrows[1], corx, cory)) {
            moveUp();
        }
        if (area2.ctx.isPointInPath(area2.arrows[2], corx, cory)) {
            moveLeft();
        }
        if (area2.ctx.isPointInPath(area2.arrows[3], corx, cory)) {
            moveRight();
        }
    }
}

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
        if (containsProfanity(nickname)){
            alert("Please choose a more appropriate username");
            $("usernameInput").value = "";
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
    area.canvas.focus();
})
$("unmute").addEventListener("click", ()=>{
    for (let i=0; i<sounds.length; i++){
        sounds[i].muted = false;
    }
    $("mute").style.display="inline";
    $("unmute").style.display="none";
    area.canvas.focus();
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
    area.canvas.focus();

})
$("infoClose").addEventListener("click", () =>{
    $("info").style.display="none";
    area.canvas.focus();
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
    area2 = new arrowarea(45, color);
    area2.canvas.addEventListener("click",buttonClick);
    
    area.ctx.translate(-area.clearance-area.size*2, -area.clearance-area.size*2);
    area.boardSets();
    area.drawAll(players);
    //drawArrows();
    drawPoints();

    $("coordinate").innerText = "Your position: "+player.position;
    $("hints").innerText = "Hints left: "+player.hints;
    area.canvas.focus();

})
socket.on("players", (users)=>{
    players = JSON.parse(users);
    $("players").innerText="Players online: "+players.length;
})
socket.on("players2", (users)=>{
    $("players").innerText="Players online: "+users;
})
socket.on("playerMoved", (id, oldx, oldy, x, y)=>{
    if (id==player.id){
        return;
    }
    var differencex = -100;
    var differencey = -100;    
    if (Math.abs(player.position[0]-oldx)<3){
        differencex = -player.position[0]+oldx;
    }else if (player.position[0]==7 && oldx==0){
        differencex=2;
    }else if (player.position[0]==8 && oldx<2){
        differencex=oldx+1;
    }else if (player.position[0]==0 && oldx>6){
        differencex=oldx-9;
    }else if (player.position[0]==1 && oldx ==8){
        differencex=-2;
    }
                
    if (Math.abs(player.position[1]-oldy)<3){
        differencey = oldy-player.position[1];
    }else if (player.position[1]==7 && oldy==0){
        differencey=2;
    }else if (player.position[1]==8 && oldy<2){
        differencey=oldy+1;
    }else if (player.position[1]==0 && oldy>6){
        differencey=oldy-9;
    }else if (player.position[1]==1 && oldy==8){
        differencey=-2;
    }
    
    var index = 12 + differencex + 5*differencey;
    if (index>-1){
        movePlayer(id, oldx, oldy, x, y, index);
    }
})
socket.on("updatePlayers", (users) =>{
    players = JSON.parse(users);
    //$("players").innerText="Players online: "+players.length;
    //drawArrows(); 
    area.drawAll(players);
    drawPoints();
})
socket.on("updateBoard", (newBoard)=>{
    area.board = JSON.parse(newBoard);
    area.drawAll(players);
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
        highscoreText += i+1+": "+highscoresAllTime[i].username+": "+highscoresAllTime[i].score+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresToday", (newScoresToday)=>{
    highscoresToday = JSON.parse(newScoresToday);
    var highscoreText = "Highscores today:<br>";
    for (var i=0;i<highscoresToday.length;i++){
        highscoreText += i+1+": "+highscoresToday[i].username+": "+highscoresToday[i].score+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresThisMonth", (newScoresToday)=>{
    highscoresThisMonth = JSON.parse(newScoresToday);
    var highscoreText = "Highscores this month:<br>";
    for (var i=0;i<highscoresThisMonth.length;i++){
        highscoreText += i+1+": "+highscoresThisMonth[i].username+": "+highscoresThisMonth[i].score+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresThisYear", (newScoresToday)=>{
    highscoresThisYear = JSON.parse(newScoresToday);
    var highscoreText = "Highscores this year:<br>";
    for (var i=0;i<highscoresThisYear.length;i++){
        highscoreText += i+1+": "+highscoresThisYear[i].username+": "+highscoresThisYear[i].score+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
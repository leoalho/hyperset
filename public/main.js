//import * as arrows from "./buttons.js";
var socket = io();
var canvas = $("myCanvas");
var ctx = canvas.getContext("2d");
canvas.width = Math.min(document.documentElement.clientWidth, 600);
canvas.height = canvas.width;
var width = canvas.width;
var height = canvas.height;
var clearance = width/40 //the distance between two diamonds
var size = 3*width/20 //half the diameter of a single diamond
ctx.lineWidth = Math.ceil(width/300);
var canvas2 = $("canvas2");
var ctx2 = canvas2.getContext("2d");
canvas2.width = 200;
canvas2.height = 200;
var movement = (size*2+clearance*2)/10;
var fontSize = canvas.height/10;
const colors = ["#00eaff", "#ff9500","#a8ff36","#8c8c8c"]
var cards = [{x:clearance, y:clearance+size, color: "black"}   ,{x:clearance*2+size*2,y:clearance+size, color: "black"}    ,{x:clearance*3+size*4,y:clearance+size, color: "black"}    ,{x:clearance*4+size*6,y:clearance+size, color: "black"},{x:clearance*5+size*8,y:clearance+size, color: "black"},
         {x:clearance,y:clearance*2+size*3, color: "black"},{x:clearance*2+size*2,y:clearance*2+size*3, color: "black"},{x:clearance*3+size*4,y:clearance*2+size*3, color: "black"},{x:clearance*4+size*6,y:clearance*2+size*3, color: "black"},{x:clearance*5+size*8,y:clearance*2+size*3, color: "black"},
         {x:clearance,y:clearance*3+size*5, color: "black"},{x:clearance*2+size*2,y:clearance*3+size*5, color: "black"},{x:clearance*3+size*4,y:clearance*3+size*5, color: "black"},{x:clearance*4+size*6,y:clearance*3+size*5, color: "black"},{x:clearance*5+size*8,y:clearance*3+size*5, color: "black"},
         {x:clearance,y:clearance*4+size*7, color: "black"},{x:clearance*2+size*2,y:clearance*4+size*7, color: "black"},{x:clearance*3+size*4,y:clearance*4+size*7, color: "black"},{x:clearance*4+size*6,y:clearance*4+size*7, color: "black"},{x:clearance*5+size*8,y:clearance*4+size*7, color: "black"},
         {x:clearance,y:clearance*5+size*9, color: "black"},{x:clearance*2+size*2,y:clearance*5+size*9, color: "black"},{x:clearance*3+size*4,y:clearance*5+size*9, color: "black"},{x:clearance*4+size*6,y:clearance*5+size*9, color: "black"},{x:clearance*5+size*8,y:clearance*5+size*9, color: "black"}]
        //locations of all of the diamonds on the canvas
var playerPosition = [0,0]; 
const locations = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]] //if needed to loop the nine cards around the current player
var playerx = 0 //your x coordinate
var playery = 0 //your y coordinate
var yourid; //your socket id
var playerColor; //your color
var yourPoints = 0;
var yourPointsTotal = 0;
var board; //2D array of the cards, [0][0]-[8][8]
var players; //list of players
var mover; //used for animation
var counter = 10; //used for animation
var moving = false; //prevents several movements at the same time
var cardsChosen = [];
var hints = 3;
var superHints = 0;
var highscoresToday = [];
var highscoresThisMonth = [];
var highscoresThisYear = [];
var highscoresAllTime = [];
var arrowButtons = [];

const click = new Audio("sounds/click.mp3");
const fail = new Audio("sounds/fail.mp3");
const success = new Audio("sounds/success.mp3");
const sounds = [click, fail, success];

function getColor(){
    for (let i=0; i<players.length;i++){
        if (players[i].id==yourid){
            color = players[i].color;
        }
    }
}

arrowButtons = createArrows(45);
drawArrows();
canvas2.addEventListener("click", buttonClick); 

function comparePoints(a,b){
    if (a.gamepoints == b.gamepoints){
        return a.created-b.created
    }
    return b.gamepoints-a.gamepoints
}

function InitRhomboidEdges(index){
    let path1 = new Path2D();
    x = cards[index].x;
    y = cards[index].y;
    path1.moveTo(x,y);
    path1.lineTo(x+size,y+size);
    path1.lineTo(x+size*2,y);
    path1.lineTo(x+size,y-size);
    path1.lineTo(x,y);
    path1.lineTo(x+size*2,y);
    path1.moveTo(x+size,y-size);
    path1.lineTo(x+size,y+size);
    return path1;
}

for(let i=0; i<cards.length; i++){
    cards[i].form=InitRhomboidEdges(i);
}

function drawRhomboid(s1,s2,s3,s4,x,y,color){
    //draws a single rhomboid, s1 NW, s2 NE, s3 SW, s4 SE corner, color denotes the color of the borders.

    ctx.fillStyle = s1;
    ctx.beginPath();
    ctx.moveTo(x+size, y);
    ctx.lineTo(x,y)
    ctx.lineTo(x+size,y-size)
    ctx.fill();

    ctx.fillStyle = s2;
    ctx.beginPath();
    ctx.moveTo(x+size, y);
    ctx.lineTo(x+size*2,y);
    ctx.lineTo(x+size,y-size);
    ctx.fill();

    ctx.fillStyle = s3;
    ctx.beginPath();
    ctx.moveTo(x+size, y);
    ctx.lineTo(x+size*2,y);
    ctx.lineTo(x+size,y+size);
    ctx.fill();

    ctx.fillStyle = s4;
    ctx.beginPath();
    ctx.moveTo(x+size, y);
    ctx.lineTo(x,y);
    ctx.lineTo(x+size,y+size);
    ctx.fill();

    /*
    ctx.beginPath();
    ctx.strokeStyle = color
    ctx.moveTo(x,y);
    ctx.lineTo(x+size,y+size);
    ctx.lineTo(x+size*2,y);
    ctx.lineTo(x+size,y-size);
    ctx.lineTo(x,y);
    ctx.lineTo(x+size*2,y);
    ctx.moveTo(x+size,y-size);
    ctx.lineTo(x+size,y+size);
    ctx.stroke();
    */

}
function drawBackground(){
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0,0, width+clearance*2+size*4, height+clearance*2+size*4);
    ctx.beginPath();
    ctx.lineTo(width+clearance*2+size*4, height+clearance*2+size*2);
    for (let i=1; i<6; i++){
        ctx.moveTo(0,(2*i-1)*size+i*clearance);
        ctx.lineTo(width+clearance*2+size*4,(2*i-1)*size+i*clearance)
        ctx.moveTo((2*i-1)*size+i*clearance,0);
        ctx.lineTo((2*i-1)*size+i*clearance,width+clearance*2+size*4);
    }
    ctx.stroke();
}
function drawBoard(x,y){
    //draws a 5x5 board with the player coordinate in the middle. 
    ctx.clearRect(clearance+size*2, clearance+size*2, width, height);
    drawBackground();
    cardCounter = 0;
    for (let i=-2; i<3; i++){
        for (let j=-2; j<3; j++){
            var a = (x+j+9)%9;
            var b = (y+i+9)%9;
            var currentCard = board[a][b];
            var boardPosition = cards[cardCounter];
            drawRhomboid(colors[currentCard.shape[0]], colors[currentCard.shape[1]], colors[currentCard.shape[2]], colors[currentCard.shape[3]], boardPosition.x, boardPosition.y, cards[cardCounter].color);
            ctx.strokeStyle = boardPosition.color;
            ctx.beginPath();
            ctx.stroke(boardPosition.form);
            cardCounter ++;
        }
    }
}
function drawPlayer(x,y,color){
    //draws a singlePlayer
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x,y,size/5,0,2*Math.PI);
    ctx.fill();
    ctx.stroke();
}
function drawYou(){
    //draws your player
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(width/2+(clearance+size*2), height/2+(clearance+size*2), size/5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
}
function drawAllPlayers(){
    for (let i=0; i<players.length; i++){
            var differencex = -100;
            var differencey = -100;
            if (players[i].id==yourid){ 
                continue;}

            if (Math.abs(playerPosition[0]-players[i].corx)<3){
                differencex = -playerPosition[0]+players[i].corx;
            }else if (playerPosition[0]==7 && players[i].corx==0){
                differencex=2;
            }else if (playerPosition[0]==8 && players[i].corx<2){
                differencex=players[i].corx+1;
            }else if (playerPosition[0]==0 && players[i].corx>6){
                differencex=players[i].corx-9;
            }else if (playerPosition[0]==1 && players[i].corx ==8){
                differencex=-2;
            }
            
            if (Math.abs(playerPosition[1]-players[i].cory)<3){
                differencey = players[i].cory-playerPosition[1];
            }else if (playerPosition[1]==7 && players[i].cory==0){
                differencey=2;
            }else if (playerPosition[1]==8 && players[i].cory<2){
                differencey=players[i].cory+1;
            }else if (playerPosition[1]==0 && players[i].cory>6){
                differencey=players[i].cory-9;
            }else if (playerPosition[1]==1 && players[i].cory==8){
                differencey=-2;
            }

            index = 12 + differencex + 5*differencey;
            if (index>-1){
                drawPlayer(cards[index].x+size, cards[index].y, players[i].color);
            }
    }
}
function drawAll(){    
    drawBoard(playerPosition[0],playerPosition[1]);
    drawAllPlayers();
    drawYou();    
}
function displayText(display){
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(clearance+size*2, clearance+size*2, width, height);
    ctx.fillStyle = "#000000";
    ctx.font = fontSize +"px Arial";
    textWidth = ctx.measureText(display).width;
    ctx.fillText(display, width/2-textWidth/2+clearance+size*2, height/2+fontSize/2+clearance+size*2);
    setTimeout(drawAll, 1000);
}
function resetColors(){
    for (let i=0; i<cards.length; i++){
        cards[i].color="black";
    }
    cardsChosen = [];
}
function colorCard(i){ 
    x = playerPosition[0]+i%5-2;
    x = (x+9)%9;
    y = playerPosition[1]+Math.floor(i/5)-2;
    y = (y+9)%9;
    coord = [x,y]
    if (board[x][y].shape[0]==3){return;}
    if (cards[i].color=="black"){
        cardsChosen.push([x,y]);
        cards[i].color=playerColor;
    }else{
        cards[i].color="black";
        for (let j=0; j<cardsChosen.length; j++){
            if (equalArrays([x,y],cardsChosen[j])){
                cardsChosen.splice(j,1);
            }
        }
    }
}
function move(movex,movey,posx,posy){
    ctx.save();
    playerx += movex;
    playery += movey;
    ctx.clearRect(clearance+size*2, clearance*1+size*2, width, height);
    ctx.translate(-playerx,-playery);
    drawBoard(playerPosition[0],playerPosition[1]);
    drawAllPlayers();
    ctx.restore();
    drawYou();
    counter--;
    if (counter == 0){
        counter = 10;
        playerx = 0;
        playery = 0;
        moving = false;
        clearInterval(mover);
        playerPosition[0] =(playerPosition[0]+posx+9)%9;
        playerPosition[1] =(playerPosition[1]+posy+9)%9;
        socket.emit("location", playerPosition[0], playerPosition[1]);
        drawBoard(playerPosition[0],playerPosition[1]);
        drawAllPlayers();
        drawYou();
        $("coordinate").innerText = "Your position: "+playerPosition;
        boardSets();
    }    
}
function checkSet(){
    if (cardsChosen.length==3){
        socket.emit("checkSet",JSON.stringify(cardsChosen));
        resetColors();
    }
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
    return false;
}
function boardSets(){
	var sets2 = 0;
	for (let i=0;i<7;i++){
		for (let j=i+1; j<8; j++){
			for (let k=j+1; k<9; k++){
                card1 = board[(playerPosition[0]+locations[i][0]+9)%9][(playerPosition[1]+locations[i][1]+9)%9].shape;
                card2 = board[(playerPosition[0]+locations[j][0]+9)%9][(playerPosition[1]+locations[j][1]+9)%9].shape;
                card3 = board[(playerPosition[0]+locations[k][0]+9)%9][(playerPosition[1]+locations[k][1]+9)%9].shape;
                if (checkSetLocal(card1,card2,card3)){
                    sets2++;
                }
            }
		}
	}
    return sets2;
}
function cursorLocation(e){
    //changes the color of the card clicked adds or removes that card to the cardsChosen Array
    let rect = canvas.getBoundingClientRect();
    let corx = e.clientX - rect.left;
    let cory = e.clientY - rect.top;
    for (let i=0; i<24; i++){
            if (ctx.isPointInPath(cards[i].form, corx, cory)) {
                colorCard(i);
                drawAll();
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

    var playerPoints = "<p><u>Your points</u><br>This game: "+yourPoints+"<br> In total: "+yourPointsTotal+ "</p><p><u>Top 5 players<br> This round: </u><br>";
    players.sort(comparePoints)
    for (let i=0; i<players.length; i++){
        playerPoints += players[i].name+": "+players[i].gamepoints+", <br>"
    }
    playerPoints += "<u>Today:</u><br>"
    for (let i=0; i<highscoresToday.length; i++){
        playerPoints += highscoresToday[i].name+": "+highscoresToday[i].points+", <br>"
    }
    playerPoints += "<u>All time:</u><br>"
    for (let i=0; i<highscoresAllTime.length; i++){
        playerPoints += highscoresAllTime[i].name+": "+highscoresAllTime[i].points+", <br>"
    }
    playerPoints += "</p>"
    $("points").innerHTML = playerPoints;
}

canvas.addEventListener("keydown", function(event){
    
    if (event.code==="ArrowDown" && !moving){
        moving=true;
        resetColors();
        mover = setInterval(()=>{
            move(0,movement,0,1);
        },50)
    }
    if (event.code==="ArrowUp" && !moving){
        moving=true;
        resetColors();
        mover = setInterval(()=>{
            move(0,-movement,0,-1);
        },50)
    }
    if (event.code==="ArrowLeft" && !moving){
        moving=true;
        resetColors();
        mover = setInterval(()=>{
            move(-movement,0,-1,0);
        },50)
    }
    if (event.code==="ArrowRight" && !moving){
        moving=true;
        resetColors();
        mover = setInterval(()=>{
            move(movement,0,1,0);
        },50);
    }
})
canvas.addEventListener("click", cursorLocation);

$("usernameInput").addEventListener("keydown", function(event){
    if (event.key === "Enter"){
        if (!socket.connected){
            alert("Server not found :(")
            return;
        }
        nickname = $("usernameInput").value;
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
    displayText(boardSets());
    hints --;
    $("hints").innerText = "Hints left: "+hints;
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
    board = JSON.parse(serverBoard);
    players = JSON.parse(users);
    yourid = socketid;
    playerPosition[0]=x;
    playerPosition[1]=y;
    playerColor = color;
    ctx.translate(-clearance-size*2, -clearance-size*2);
    boardSets();
    drawBoard(playerPosition[0],playerPosition[1]);
    drawAllPlayers(); 
    drawYou();
    drawPoints(); 
    $("coordinate").innerText = "Your position: "+playerPosition;
    $("hints").innerText = "Hints left: "+hints;
    canvas.focus();

})
socket.on("players", (users)=>{
    players = JSON.parse(users);
    $("players").innerText="Players online: "+players.length;
})
socket.on("updatePlayers", (users) =>{
    players = JSON.parse(users);
    $("players").innerText="Players online: "+players.length;
    drawBoard(playerPosition[0],playerPosition[1]);
    drawArrows(); 
    drawAllPlayers(); 
    drawYou();
    drawPoints();
})
socket.on("updateBoard", (newBoard)=>{
    board = JSON.parse(newBoard);
    drawBoard(playerPosition[0],playerPosition[1]); 
    drawAllPlayers(); 
    drawYou();
    boardSets();
})
socket.on("set", (set) =>{
    if (set){
        displayText("SUCCESS!")
        success.play();
        hints ++;
        yourPoints ++;
        yourPointsTotal ++;
        $("hints").innerText = "Hints left: "+hints;
        $("hint").disabled = false;
        return;
    }
    displayText("FAIL!")
    fail.play();
    yourPoints --;
    yourPointsTotal --;
})
socket.on("allSets", (sets) =>{
    $("allSets").innerText = "Collections left: " +sets;
})
socket.on("gameOver", (timeLeft) =>{
    yourPoints = 0;
    drawAll();
    moving = true;
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(clearance+size*2, clearance+size*2, width, height);
    ctx.fillStyle = "#000000";
    ctx.font = fontSize +"px Arial";
    var a = "GAME OVER"
    textWidtha = ctx.measureText(a).width;
    var b = "NEW GAME IN"
    textWidthb = ctx.measureText(b).width;
    var c = timeLeft.toString();
    textWidthc = ctx.measureText(c).width;
    ctx.fillText(a, width/2-textWidtha/2+clearance+size*2, height/2-fontSize*0.5+clearance+size*2);
    ctx.fillText(b, width/2-textWidthb/2+clearance+size*2, height/2+fontSize*0.5+clearance+size*2)
    ctx.fillText(c, width/2-textWidthc/2+clearance+size*2, height/2+fontSize*1.5+clearance+size*2);
})
socket.on("mayMove",()=>{
    moving = false;
})
socket.on("updateHighScores",(newScoresToday,newScoresAllTime)=>{
    highscoresToday = JSON.parse(newScoresToday);
    highscoresAllTime = JSON.parse(newScoresAllTime);
    drawPoints();
})
socket.on("highscoresAllTime",(newScoresAllTime)=>{
    highscoresAllTime = JSON.parse(newScoresAllTime);
    var highscoreText = "Highscores alltime:<br>";
    for (i=0;i<highscoresAllTime.length;i++){
        highscoreText += i+1+": "+highscoresAllTime[i].name+": "+highscoresAllTime[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresToday", (newScoresToday)=>{
    highscoresToday = JSON.parse(newScoresToday);
    var highscoreText = "Highscores today:<br>";
    for (i=0;i<highscoresToday.length;i++){
        highscoreText += i+1+": "+highscoresToday[i].name+": "+highscoresToday[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresThisMonth", (newScoresToday)=>{
    highscoresThisMonth = JSON.parse(newScoresToday);
    var highscoreText = "Highscores this month:<br>";
    for (i=0;i<highscoresThisMonth.length;i++){
        highscoreText += i+1+": "+highscoresThisMonth[i].name+": "+highscoresThisMonth[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})
socket.on("highscoresThisYear", (newScoresToday)=>{
    highscoresThisYear = JSON.parse(newScoresToday);
    var highscoreText = "Highscores this year:<br>";
    for (i=0;i<highscoresThisYear.length;i++){
        highscoreText += i+1+": "+highscoresThisYear[i].name+": "+highscoresThisYear[i].points+"<br>";
    }
    $("highscoreText").innerHTML=highscoreText;
})





import {player} from "./player.js";
import {$, equalArrays} from "./utils.js";

export class Area{
	constructor(){
        this.locations = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]] //if needed to loop the nine cards around the current player
		this.canvas = $("myCanvas");
        this.canvas.width = Math.min(document.documentElement.clientWidth, 600);
        this.canvas.height = this.canvas.width;
        this.ctx = this.canvas.getContext("2d");
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.players = [];
        this.board; //2D array of the cards, [0][0]-[8][8]
		this.clearance = this.width/40 //the distance between two diamonds
		this.size = 3*this.width/20 //half the diameter of a single diamond
		this.ctx.lineWidth = Math.ceil(this.width/300);
		this.movement = (this.size*2+this.clearance*2)/10;
		this.fontSize = this.height/10;
		this.colors = ["#00eaff", "#ff9500","#a8ff36","#8c8c8c"]
		this.cards =   [{x:this.clearance, y:this.clearance+this.size, color: "black"}   ,{x:this.clearance*2+this.size*2,y:this.clearance+this.size, color: "black"}    ,{x:this.clearance*3+this.size*4,y:this.clearance+this.size, color: "black"}    ,{x:this.clearance*4+this.size*6,y:this.clearance+this.size, color: "black"},{x:this.clearance*5+this.size*8,y:this.clearance+this.size, color: "black"},
         			    {x:this.clearance,y:this.clearance*2+this.size*3, color: "black"},{x:this.clearance*2+this.size*2,y:this.clearance*2+this.size*3, color: "black"},{x:this.clearance*3+this.size*4,y:this.clearance*2+this.size*3, color: "black"},{x:this.clearance*4+this.size*6,y:this.clearance*2+this.size*3, color: "black"},{x:this.clearance*5+this.size*8,y:this.clearance*2+this.size*3, color: "black"},
         			    {x:this.clearance,y:this.clearance*3+this.size*5, color: "black"},{x:this.clearance*2+this.size*2,y:this.clearance*3+this.size*5, color: "black"},{x:this.clearance*3+this.size*4,y:this.clearance*3+this.size*5, color: "black"},{x:this.clearance*4+this.size*6,y:this.clearance*3+this.size*5, color: "black"},{x:this.clearance*5+this.size*8,y:this.clearance*3+this.size*5, color: "black"},
         			    {x:this.clearance,y:this.clearance*4+this.size*7, color: "black"},{x:this.clearance*2+this.size*2,y:this.clearance*4+this.size*7, color: "black"},{x:this.clearance*3+this.size*4,y:this.clearance*4+this.size*7, color: "black"},{x:this.clearance*4+this.size*6,y:this.clearance*4+this.size*7, color: "black"},{x:this.clearance*5+this.size*8,y:this.clearance*4+this.size*7, color: "black"},
         			    {x:this.clearance,y:this.clearance*5+this.size*9, color: "black"},{x:this.clearance*2+this.size*2,y:this.clearance*5+this.size*9, color: "black"},{x:this.clearance*3+this.size*4,y:this.clearance*5+this.size*9, color: "black"},{x:this.clearance*4+this.size*6,y:this.clearance*5+this.size*9, color: "black"},{x:this.clearance*5+this.size*8,y:this.clearance*5+this.size*9, color: "black"}]
        			//locations of all of the diamonds on the canvas
        for(let i=0; i<this.cards.length; i++){
            this.cards[i].form=this.InitRhomboidEdges(i);
        }
                
        }
    InitRhomboidEdges(index){
    	let path1 = new Path2D();
    	var x = this.cards[index].x;
        var y = this.cards[index].y;
        path1.moveTo(x,y);
        path1.lineTo(x+this.size,y+this.size);
        path1.lineTo(x+this.size*2,y);
        path1.lineTo(x+this.size,y-this.size);
        path1.lineTo(x,y);
        path1.lineTo(x+this.size*2,y);
        path1.moveTo(x+this.size,y-this.size);
        path1.lineTo(x+this.size,y+this.size);
        return path1;
    }
    drawRhomboid(s1,s2,s3,s4,x,y,color){
        //draws a single rhomboid, s1 NW, s2 NE, s3 SW, s4 SE corner, color denotes the color of the borders.
    
        this.ctx.fillStyle = s1;
        this.ctx.beginPath();
        this.ctx.moveTo(x+this.size, y);
        this.ctx.lineTo(x,y)
        this.ctx.lineTo(x+this.size,y-this.size)
        this.ctx.fill();
    
        this.ctx.fillStyle = s2;
        this.ctx.beginPath();
        this.ctx.moveTo(x+this.size, y);
        this.ctx.lineTo(x+this.size*2,y);
        this.ctx.lineTo(x+this.size,y-this.size);
        this.ctx.fill();
    
        this.ctx.fillStyle = s3;
        this.ctx.beginPath();
        this.ctx.moveTo(x+this.size, y);
        this.ctx.lineTo(x+this.size*2,y);
        this.ctx.lineTo(x+this.size,y+this.size);
        this.ctx.fill();
    
        this.ctx.fillStyle = s4;
        this.ctx.beginPath();
        this.ctx.moveTo(x+this.size, y);
        this.ctx.lineTo(x,y);
        this.ctx.lineTo(x+this.size,y+this.size);
        this.ctx.fill();    
    }
    drawBackground(){
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0,0, this.width+this.clearance*2+this.size*4, this.height+this.clearance*2+this.size*4);
        this.ctx.beginPath();
        this.ctx.lineTo(this.width+this.clearance*2+this.size*4, this.height+this.clearance*2+this.size*2);
        for (let i=1; i<6; i++){
            this.ctx.moveTo(0,(2*i-1)*this.size+i*this.clearance);
            this.ctx.lineTo(this.width+this.clearance*2+this.size*4,(2*i-1)*this.size+i*this.clearance)
            this.ctx.moveTo((2*i-1)*this.size+i*this.clearance,0);
            this.ctx.lineTo((2*i-1)*this.size+i*this.clearance,this.width+this.clearance*2+this.size*4);
        }
        this.ctx.stroke();
    }
    colorCard(i){ 
        var x = player.position[0]+i%5-2;
        x = (x+9)%9;
        var y = player.position[1]+Math.floor(i/5)-2;
        y = (y+9)%9;
        if (this.board[x][y].shape[0]==3){return;}
        if (this.cards[i].color=="black"){
            player.cardsChosen.push([x,y]);
            this.cards[i].color=player.color;
        }else{
            this.cards[i].color="black";
            for (let j=0; j<player.cardsChosen.length; j++){
                if (equalArrays([x,y],player.cardsChosen[j])){
                    player.cardsChosen.splice(j,1);
                }
            }
        }
    }
    drawPlayer(x,y,color){
        //draws a singlePlayer
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x,y,this.size/5,0,2*Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }
    drawYou(){
        //draws your player
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.width/2+(this.clearance+this.size*2), this.height/2+(this.clearance+this.size*2), this.size/5, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }
    drawAllPlayers(players){
        for (let i=0; i<players.length; i++){
                var differencex = -100;
                var differencey = -100;
                if (players[i].id==player.id){ 
                    continue;}
    
                if (Math.abs(player.position[0]-players[i].corx)<3){
                    differencex = -player.position[0]+players[i].corx;
                }else if (player.position[0]==7 && players[i].corx==0){
                    differencex=2;
                }else if (player.position[0]==8 && players[i].corx<2){
                    differencex=players[i].corx+1;
                }else if (player.position[0]==0 && players[i].corx>6){
                    differencex=players[i].corx-9;
                }else if (player.position[0]==1 && players[i].corx ==8){
                    differencex=-2;
                }
                
                if (Math.abs(player.position[1]-players[i].cory)<3){
                    differencey = players[i].cory-player.position[1];
                }else if (player.position[1]==7 && players[i].cory==0){
                    differencey=2;
                }else if (player.position[1]==8 && players[i].cory<2){
                    differencey=players[i].cory+1;
                }else if (player.position[1]==0 && players[i].cory>6){
                    differencey=players[i].cory-9;
                }else if (player.position[1]==1 && players[i].cory==8){
                    differencey=-2;
                }
    
                var index = 12 + differencex + 5*differencey;
                if (index>-1){
                    this.drawPlayer(this.cards[index].x+this.size, this.cards[index].y, players[i].color);
                }
        }
    }
    resetColors(){
        for (let i=0; i<this.cards.length; i++){
            this.cards[i].color="black";
        }
    }
    drawBoard(){
        //draws a 5x5 board with the player coordinate in the middle. 
        var x = player.position[0];
        var y = player.position[1];
        this.ctx.clearRect(this.clearance+this.size*2, this.clearance+this.size*2, this.width, this.height);
        this.drawBackground();
        var cardCounter = 0;
        for (let i=-2; i<3; i++){
            for (let j=-2; j<3; j++){
                var a = (x+j+9)%9;
                var b = (y+i+9)%9;
                var currentCard = this.board[a][b];
                var boardPosition = this.cards[cardCounter];
                this.drawRhomboid(this.colors[currentCard.shape[0]], this.colors[currentCard.shape[1]], this.colors[currentCard.shape[2]], this.colors[currentCard.shape[3]], boardPosition.x, boardPosition.y, this.cards[cardCounter].color);
                this.ctx.strokeStyle = boardPosition.color;
                this.ctx.beginPath();
                this.ctx.stroke(boardPosition.form);
                cardCounter ++;
            }
        }
    }
    drawAll(players){    
        this.drawBoard();
        this.drawAllPlayers(players);
        this.drawYou();  
    }
    move(players){
        this.ctx.save();
        this.ctx.clearRect(this.clearance+this.size*2, this.clearance*1+this.size*2, this.width, this.height);
        this.ctx.translate(-player.x,-player.y);
        this.drawBoard();
        this.drawAllPlayers(players);
        this.ctx.restore();
        this.drawYou();
    }
    gameOver(timeLeft, players){
        this.drawAll(players);
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        this.ctx.fillRect(this.clearance+this.size*2, this.clearance+this.size*2, this.width, this.height);
        this.ctx.fillStyle = "#000000";
        this.ctx.font = this.fontSize +"px Arial";
        var a = "GAME OVER"
        var textWidtha = this.ctx.measureText(a).width;
        var b = "NEW GAME IN"
        var textWidthb = this.ctx.measureText(b).width;
        var c = timeLeft.toString();
        var textWidthc = this.ctx.measureText(c).width;
        this.ctx.fillText(a, this.width/2-textWidtha/2+this.clearance+this.size*2, this.height/2-this.fontSize*0.5+this.clearance+this.size*2);
        this.ctx.fillText(b, this.width/2-textWidthb/2+this.clearance+this.size*2, this.height/2+this.fontSize*0.5+this.clearance+this.size*2)
        this.ctx.fillText(c, this.width/2-textWidthc/2+this.clearance+this.size*2, this.height/2+this.fontSize*1.5+this.clearance+this.size*2);
    }
    checkSetLocal(card1,card2,card3){
        // Returns true if the elements form a set and false if not.
        if (card1[0]==3 || card2[0]==3 || card3[0]==3){ return false}
        var numbersMatch = (card1[0]+card2[0]+card3[0])%3;
        var colorsMatch = (card1[1]+card2[1]+card3[1])%3;
        var fillsMatch = (card1[2]+card2[2]+card3[2])%3;
        var shapesMatch = (card1[3]+card2[3]+card3[3])%3;
        if (numbersMatch + colorsMatch + fillsMatch + shapesMatch == 0){
            return true;
        }
        return false;
    }
    boardSets(){
        var sets2 = 0;
        for (let i=0;i<7;i++){
            for (let j=i+1; j<8; j++){
                for (let k=j+1; k<9; k++){
                    var card1 = this.board[(player.position[0]+this.locations[i][0]+9)%9][(player.position[1]+this.locations[i][1]+9)%9].shape;
                    var card2 = this.board[(player.position[0]+this.locations[j][0]+9)%9][(player.position[1]+this.locations[j][1]+9)%9].shape;
                    var card3 = this.board[(player.position[0]+this.locations[k][0]+9)%9][(player.position[1]+this.locations[k][1]+9)%9].shape;
                    if (this.checkSetLocal(card1,card2,card3)){
                        sets2++;
                    }
                }
            }
        }
        return sets2;
    }
    displayText(display, players){
        this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        this.ctx.fillRect(this.clearance+this.size*2, this.clearance+this.size*2, this.width, this.height);
        this.ctx.fillStyle = "#000000";
        this.ctx.font = this.fontSize +"px Arial";
        var textWidth = this.ctx.measureText(display).width;
        this.ctx.fillText(display, this.width/2-textWidth/2+this.clearance+this.size*2, this.height/2+this.fontSize/2+this.clearance+this.size*2);
    }
}
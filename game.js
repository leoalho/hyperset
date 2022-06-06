const {shuffleArray, equalArrays, checkSet} = require("./utils.js");
const locations = [[-1,-1],[0,-1],[1,-1],[-1,0],[0,0],[1,0],[-1,1],[0,1],[1,1]];

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
        console.table(this.setsfound);
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
}

module.exports = {game};
function shuffleArray (array){
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

function randomColor(){
    return "#" + Math.floor(Math.random()*16777215).toString(16);
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

function timer(game, io){
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

module.exports = {
    shuffleArray,
    equalArrays,
    randomColor,
    checkSet,
    timer
}
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

module.exports = {
    shuffleArray,
    equalArrays,
    randomColor
}
function $(x) {
  return document.getElementById(x);
}

function equalArrays(a, b) {
  // compares if two arrays include the same elements in the same positions
  if (a.length != b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] != b[i]) return false;
  }
  return true;
}

function randomColor() {
  randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return "#" + randomColor;
}

const shuffleArray = (array) => {
  // function for shuffling arrays
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
};

function comparePoints(a, b) {
  if (a.gamepoints == b.gamepoints) {
    return a.created - b.created;
  }
  return b.gamepoints - a.gamepoints;
}

export { $, equalArrays, randomColor, shuffleArray, comparePoints };

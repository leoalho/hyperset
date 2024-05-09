export var player = {
  position: [0, 0],
  x: 0, //your x coordinate
  y: 0, //your y coordinate
  id: 0, //your socket id
  color: "#000000", //your color
  points: 0,
  pointsTotal: 0,
  moving: false, //prevents several movements at the same time
  cardsChosen: [],
  hints: 3,
  // var superHints = 0;
};

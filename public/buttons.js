function createLeftButton(size){
    var button = new Path2D();
    var middle = 100;
    button.moveTo(10,middle);
    button.lineTo(10+size,middle-size);
    button.lineTo(10+size,middle+size);
    button.lineTo(10,middle);
    return button;
}

function createRightButton(size){
    var button = new Path2D();
    var middle = 100;
    button.moveTo(190,middle);
    button.lineTo(190-size,middle-size);
    button.lineTo(190-size,middle+size);
    button.lineTo(190,middle);
    return button;
}

function createUpButton(size){
    var button = new Path2D();
    var middle = 100;
    button.moveTo(middle,10);
    button.lineTo(middle+size,10+size);
    button.lineTo(middle-size,10+size);
    button.lineTo(middle,10);
    return button;
}

function createDownButton(size){
    var button = new Path2D();
    var middle = 100;
    button.moveTo(middle,190);
    button.lineTo(middle+size,190-size);
    button.lineTo(middle-size,190-size);
    button.lineTo(middle,190);
    return button;
}

function buttonClick(event){
    let rect = canvas2.getBoundingClientRect();
    let corx = event.clientX - rect.left;
    let cory = event.clientY - rect.top;
    if (ctx2.isPointInPath(arrowButtons[0], corx, cory)) {
        if (!moving){
            moving=true;
            resetColors();
            mover = setInterval(()=>{
                move(0,movement,0,1);
            },50)
        }
    }
    if (ctx2.isPointInPath(arrowButtons[1], corx, cory)) {
        if (!moving){
            moving=true;
            resetColors();
            mover = setInterval(()=>{
                move(0,-movement,0,-1);
            },50)   
        }
    }
    if (ctx2.isPointInPath(arrowButtons[2], corx, cory)) {
        if (!moving){
            moving=true;
            resetColors();
            mover = setInterval(()=>{
                move(-movement,0,-1,0);
            },50) 
        }
    }
    if (ctx2.isPointInPath(arrowButtons[3], corx, cory)) {
        if (!moving){
            moving=true;
            resetColors();
            mover = setInterval(()=>{
                move(movement,0,1,0);
            },50);
        }
    }
}

function createArrows(size){
    var arrows=[createDownButton(size),createUpButton(size),createLeftButton(size),createRightButton(size)];
    return arrows;
}

function drawArrows(){
    arrowButtons.forEach(element => {
        ctx2.fillStyle = playerColor;
        ctx2.fill(element);
        ctx2.stroke(element);
    });
}

//export {createLeftButton,createRightButton,createDownButton,createUpButton,buttonClick, createArrows, drawArrows};

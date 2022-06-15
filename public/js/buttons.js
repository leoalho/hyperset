import {$} from "./utils.js"
import {player} from "./player.js"

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

export class arrowarea {
    constructor(size,color){
        this.canvas = $("canvas2");
        this.ctx = canvas2.getContext("2d");
        this.canvas.width = 200;
        this.canvas.height = 200;
        this.arrows=[createDownButton(size),createUpButton(size),createLeftButton(size),createRightButton(size)]
        this.color = color;
        this.drawArrows();

    }
    drawArrows(){
        this.arrows.forEach(element => {
            this.ctx.fillStyle = this.color;
            this.ctx.fill(element);
            this.ctx.stroke(element);
        });
    }   
}
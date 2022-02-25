import * as p5 from "p5"

console.log("Entry");

const p5Instance = new p5((p: p5) => {
  p.setup = () => {
    const w = 360;
    const h = w;

    p.createCanvas(w, h, p.WEBGL).parent("canvasContainer");

    p.drawingContext.shadowOffsetX = 5;
    p.drawingContext.shadowOffsetY = -5;
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = "black";
    p.background(200);
    p.ellipse(0, 0, 50, 50);
  };

  p.draw = () => {

  };

});

const width = 200;
const height = 100;

function createWalls() {

}

// function mousePressed(event) {
//   console.log(event);
//   console.log(windowWidth);
//   console.log(displayWidth);
//   fullscreen(!fullscreen());
//   return false;
// }

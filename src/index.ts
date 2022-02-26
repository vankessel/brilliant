import * as p5 from "p5"
import Ball from "./ball";
import Vec2 from "./vec2";
import { calcImageGrid } from "./helpers";
import { clamp, mod } from "./math";
// import soundAsset1 from "../assets/sounds/button1.ogg"
// import soundAsset2 from "../assets/sounds/button2.ogg"

const p5Instance = new p5((p: p5) => {
  let pg_grid: p5.Graphics;
  let pg_paths: p5.Graphics;
  // let font: p5.Font;
  let viewData: { firstPos: Vec2; firstXFlip: boolean; firstYFlip: boolean; rowCount: number; colCount: number; };
  let canvasSize: Vec2;
  let viewSize: Vec2;
  let zoomFactor: number = 1;
  let zoomSmoothing: number = 0.92;
  let targetZoomMin = 0.3;
  let targetZoomMax = 1;
  let _targetZoomFactor: number = 1;

  let balls: Ball[] = new Array<Ball>();
  let ballIdx = 0;
  let maxBalls = 16;

  function launchBall(pos: Vec2, vec: Vec2, w: number, h: number) {
    let correctedPos = pos.add(new Vec2(pg_grid.width / 2, pg_grid.height / 2));
    const flipX = Math.floor(correctedPos.x / pg_grid.width) % 2 !== 0;
    const flipY = Math.floor(correctedPos.y / pg_grid.height) % 2 !== 0;
    const scaleX = flipX ? -1 : 1;
    const scaleY = flipY ? -1 : 1;
    const scale = new Vec2(scaleX, scaleY);
    correctedPos = pos.mult(scale).add(new Vec2(pg_grid.width / 2, pg_grid.height / 2));
    correctedPos.x = mod(correctedPos.x, pg_grid.width);
    correctedPos.y = mod(correctedPos.y, pg_grid.height);
    let correctedVel = vec.mult(scale);
    let lifetime = life_slider.value() as number;
    if (balls.length < maxBalls) {
      const ball = new Ball(correctedPos, correctedVel, correctedVel.mag(), new Vec2(0, w), new Vec2(0, h), null, 8, lifetime);
      balls.push(ball);
    } else {
      const ball = balls[ballIdx];
      ball.construct(correctedPos, correctedVel, correctedVel.mag(), new Vec2(0, w), new Vec2(0, h), null, 8, lifetime);
    }
    ballIdx = (ballIdx + 1) % maxBalls;
  }

  function setTargetZoom(targetZoomFactor: number) {
    _targetZoomFactor = clamp(targetZoomFactor, targetZoomMin, targetZoomMax);
  }

  // let ballSpawnSounds = new Array<p5.SoundFile>();
  p.preload = () => {
    // font = p.loadFont(soleil);
    // photonImg = p.loadImage(photonAsset);
    // ballSpawnSounds.push(p.loadSound(soundAsset1));
    // ballSpawnSounds.push(p.loadSound(soundAsset2));
  }

  p.setup = () => {
    const canvasWidth = 480;
    const canvasHeight = canvasWidth;
    p.createCanvas(canvasWidth, canvasHeight, p.WEBGL).parent("canvasContainer");
    p.frameRate(60);
    // p.textFont(font);
    p.textSize(20);

    // Setup render texture
    viewSize = new Vec2(200, 300);
    // Tiling viewport
    pg_grid = p.createGraphics(viewSize.x, viewSize.y);
    // Paths layer
    pg_paths = p.createGraphics(p.width * 4, p.height * 4);

    const randAngle = p.random() * 2 * Math.PI;
    const speed = 60;

    life_slider = p.createSlider(1, 16, 8);
    life_slider.parent("lifeSlider");
    w_slider = p.createSlider(50, 480, viewSize.x);
    w_slider.parent("wSlider");
    h_slider = p.createSlider(50, 480, viewSize.y);
    h_slider.parent("hSlider");
  };

  let life_slider: p5.Element;
  let w_slider: p5.Element;
  let h_slider: p5.Element;
  p.draw = () => {
    const newW = w_slider.value() as number;
    const newH = h_slider.value() as number;
    if (newW !== pg_grid.width || newH !== pg_grid.height) {
      pg_grid = p.createGraphics(newW, newH);
      for (const ball of balls) {
        ball.xBounds.y = newW;
        ball.yBounds.y = newH;
        ball.ignoreThisFrameReflection = true;
        ball.contactHistory = new Array<Vec2>();
        ball.contactHistory.push();
        ball.initPos = ball.pos;
      }
    }

    p.push();
    pg_grid.push()
    pg_paths.push()

    p.background(255, 0, 255);
    pg_grid.background(200);
    pg_paths.clear(0, 0, 0, 0);

    drawWalls(pg_grid, pg_grid.width, pg_grid.height);
    balls.forEach(ball => {
      ball.update(pg_grid.deltaTime / 1000);
      ball.draw(pg_grid, pg_paths);
    });

    canvasSize = new Vec2(p.width, p.height);
    viewSize = new Vec2(pg_grid.width, pg_grid.height);

    zoomFactor = zoomSmoothing * zoomFactor + (1 - zoomSmoothing) * _targetZoomFactor;
    viewData = calcImageGrid(canvasSize, Vec2.zero, viewSize, zoomFactor);

    // Copy to image so we can transform it
    var img = p.createImage(pg_grid.width, pg_grid.height);
    img.copy(pg_grid, 0, 0, pg_grid.width, pg_grid.height, 0, 0, pg_grid.width, pg_grid.height);

    let pos;
    let xFlip = viewData.firstXFlip;
    let yFlip = viewData.firstYFlip;
    p.imageMode(p.CENTER);
    p.scale(zoomFactor);
    for (let rowIdx = 0; rowIdx < viewData.rowCount; rowIdx++) {
      for (let colIdx = 0; colIdx < viewData.colCount; colIdx++) {
        pos = new Vec2(viewData.firstPos.x + colIdx * pg_grid.width, viewData.firstPos.y + rowIdx * pg_grid.height);
        const idx = rowIdx * viewData.colCount + colIdx;
        const total = viewData.colCount * viewData.rowCount;
        const percent = idx / total;
        p.push();
        const xScale = xFlip ? -1 : 1;
        const yScale = yFlip ? -1 : 1;
        p.scale(xScale, yScale);
        if (idx !== (total - 1) / 2) {
          p.tint(255, 200);
        }
        p.image(img, pos.x * xScale, pos.y * yScale);
        // p.fill(0, 255 * colIdx / viewData.colCount, 0);
        // p.text(`${xFlip} ${yFlip}`, pos.x * xScale, pos.y * yScale);
        p.pop();
        xFlip = !xFlip;
      }
      xFlip = viewData.firstXFlip;
      yFlip = !yFlip;
    }

    // Slingshot
    if (isDragging) {
      pg_paths.push();
      pg_paths.stroke(200, 0, 0);
      pg_paths.strokeWeight(2);
      const offset = new Vec2((pg_paths.width - p.width) / 2, (pg_paths.height - p.height) / 2);
      const currentMouse = new Vec2((p.mouseX - p.width / 2) / zoomFactor, (p.mouseY - p.height / 2) / zoomFactor);
      pg_paths.line(
        lastMousePress.x + offset.x + p.width / 2, lastMousePress.y + offset.y + p.height / 2,
        currentMouse.x + offset.x + p.width / 2, currentMouse.y + offset.y + p.height / 2
      );
      pg_paths.pop();
    }

    // var img = p.createImage(pg.width, pg.height);
    // img.copy(pg, 0, 0, pg.width, pg.height, 0, 0, pg.width, pg.height);
    p.image(pg_paths, 0, 0);

    // Draw rope
    // pg.line()

    pg_paths.pop();
    pg_grid.pop();
    p.pop();
  };

  p.keyPressed = (event: KeyboardEvent) => {
  }

  let lastMousePress: Vec2;
  let lastMouseRelease: Vec2;
  let isDragging = false;
  p.mousePressed = (event: MouseEvent) => {
    legitPressed = (event.target as HTMLElement).id === 'defaultCanvas0';
    lastMousePress = new Vec2((p.mouseX - p.width / 2) / zoomFactor, (p.mouseY - p.height / 2) / zoomFactor);
  }
  p.mouseDragged = (event: MouseEvent) => {
    if (legitPressed) {
      isDragging = true;
    }
  }
  p.mouseReleased = (event: MouseEvent) => {
    lastMouseRelease = new Vec2((p.mouseX - p.width / 2) / zoomFactor, (p.mouseY - p.height / 2) / zoomFactor);
    // console.log(`released ${lastMouseRelease.x} ${lastMouseRelease.y}`);
    if (isDragging) {
      isDragging = false;
      launchBall(lastMouseRelease, lastMousePress.sub(lastMouseRelease), pg_grid.width, pg_grid.height);
    }
    legitPressed = false;
  }
  let legitPressed = false;

  p.mouseWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;

    const s = 1.08;

    // Up
    if (event.deltaY < 0) {
      setTargetZoom(_targetZoomFactor * s);
    } else {
      setTargetZoom(_targetZoomFactor / s);
    }
  }
});

function drawLine(p: p5, pos: Vec2, dPos: Vec2, w: number, s: number) {
  p.push();
  p.strokeWeight(w);
  p.line(pos.x, pos.y, pos.x + dPos.x * s, pos.y + dPos.y * s);
  p.pop();
}

function drawWalls(p: p5, w: number, h: number) {
  p.push();
  p.fill(16);

  const d = 16;
  const w2 = w / 2;
  const h2 = h / 2;
  const xCenter = p.width / 2;
  const yCenter = p.height / 2;

  //Right wall
  let leftBound = w2 + xCenter;
  let topBound = -h2 + yCenter;
  p.rect(leftBound, topBound, d, h);
  //Bot wall
  leftBound = -w2 + xCenter;
  topBound = h2 + yCenter;
  p.rect(leftBound, topBound, w, d);
  //Left wall
  leftBound = -w2 - d + xCenter;
  topBound = -h2 + yCenter;
  p.rect(leftBound, topBound, d, h);
  //Top wall
  leftBound = -w2 + xCenter;
  topBound = -h2 - d + yCenter;
  p.rect(leftBound, topBound, w, d);
  p.pop();
}
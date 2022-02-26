import * as p5 from "p5"
import img from "../assets/images/photon.png"

const p5Instance = new p5((p: p5) => {
  let pg: p5.Graphics;
  let font: p5.Font;
  let ball: Ball;
  let viewData: { firstPos: Vec2; firstXFlip: boolean; firstYFlip: boolean; rowCount: number; colCount: number; };
  let canvasSize: Vec2;
  let viewSize: Vec2;
  let zoomFactor: number = 1;
  let zoomSmoothing: number = 0.92;
  let targetZoomMin = 0.3;
  let targetZoomMax = 1;
  let _targetZoomFactor: number = 1;

  function launchBall(pos: Vec2, vec: Vec2, w: number, h: number) {
    console.log("Launched");
    ball = new Ball(pos.add(new Vec2(pg.width/2, pg.height/2)), vec, vec.mag(), new Vec2(0, w), new Vec2(0, h))
  }

  function setTargetZoom(targetZoomFactor: number) {
    _targetZoomFactor = clamp(targetZoomFactor, targetZoomMin, targetZoomMax);
  }

  p.preload = () => {
    // font = p.loadFont(soleil);
  }

  p.setup = () => {
    const canvasWidth = 360;
    const canvasHeight = canvasWidth;
    p.createCanvas(canvasWidth, canvasHeight, p.WEBGL).parent("canvasContainer");
    p.frameRate(60);
    p.textFont(font);
    p.textSize(20);

    // Setup render texture
    const extra = 0;
    viewSize = new Vec2(200, 300);
    pg = p.createGraphics(viewSize.x + extra, viewSize.y + extra);

    const randAngle = p.random() * 2 * Math.PI;
    const speed = 60;
    ball = new Ball(new Vec2(pg.width / 2, pg.height / 2), new Vec2(Math.cos(randAngle), Math.sin(randAngle)), speed, new Vec2(0, pg.width), new Vec2(0, pg.height));
  };

  p.draw = () => {
    p.push();
    pg.push()

    p.background(255, 0, 255);
    pg.background(200);

    drawWalls(pg, pg.width, pg.height);
    ball.update(pg.deltaTime / 1000);
    ball.draw(pg);

    canvasSize = new Vec2(p.width, p.height);
    viewSize = new Vec2(pg.width, pg.height);

    zoomFactor = zoomSmoothing * zoomFactor + (1 - zoomSmoothing) * _targetZoomFactor;
    viewData = calcImageGrid(canvasSize, Vec2.zero, viewSize, zoomFactor);

    // Copy to image so we can transform it
    var img = p.createImage(pg.width, pg.height);
    img.copy(pg, 0, 0, pg.width, pg.height, 0, 0, pg.width, pg.height);

    let pos;
    let xFlip = viewData.firstXFlip;
    let yFlip = viewData.firstYFlip;
    p.imageMode(p.CENTER);
    p.scale(zoomFactor);
    for (let rowIdx = 0; rowIdx < viewData.rowCount; rowIdx++) {
      for (let colIdx = 0; colIdx < viewData.colCount; colIdx++) {
        pos = new Vec2(viewData.firstPos.x + colIdx * pg.width, viewData.firstPos.y + rowIdx * pg.height);
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
    p.rectMode(p.CENTER);
    p.rect(viewData.firstPos.x, viewData.firstPos.y, 30, 30);

    pg.pop();
    p.pop();
  };

  p.keyPressed = (event: KeyboardEvent) => {
    console.log(`Key: ${event.key}`);
    switch (event.key) {
      case '1':
        _targetZoomFactor = 1;
        break;
      case '2':
        _targetZoomFactor = .75;
        break;
      case '3':
        _targetZoomFactor = .5;
        break;
      case '4':
        _targetZoomFactor = .25;
        break;
      default:
        break;
    }
  }

  let lastMousePress: Vec2;
  let lastMouseRelease: Vec2;
  let isDragging = false;
  p.mousePressed = (event: MouseEvent) => {
    lastMousePress = new Vec2(p.mouseX - p.width/2, p.mouseY - p.height/2);
    console.log(`pressed ${lastMousePress.x} ${lastMousePress.y}`);
  }
  p.mouseDragged = (event: MouseEvent) => {
    console.log("dragged");
    isDragging = true;
  }
  p.mouseReleased = (event: MouseEvent) => {
    lastMouseRelease = new Vec2(p.mouseX - p.width/2, p.mouseY - p.height/2);
    console.log(`released ${lastMouseRelease.x} ${lastMouseRelease.y}`);
    if (isDragging) {
      isDragging = false;
      launchBall(lastMouseRelease, lastMousePress.sub(lastMouseRelease), pg.width, pg.height);
    }
  }

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

function drawBall(p: p5, x: number, y: number, r: number, s: number, a: number = 255) {
  p.push();
  p.fill(255, a)
  p.stroke(0, a);
  p.strokeWeight(s);
  // p.drawingContext.shadowOffsetX = 5;
  // p.drawingContext.shadowOffsetY = -5;
  // p.drawingContext.shadowBlur = 10;
  // p.drawingContext.shadowColor = "black";
  p.ellipse(x, y, r * 2, r * 2);
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

class Vec2 {
  static readonly zero = new Vec2(0, 0);

  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  normalized(): Vec2 {
    return this.scale(1 / Math.sqrt(this.x * this.x + this.y * this.y))
  }

  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

class Ball {
  r: number;
  pos: Vec2;
  dir: Vec2;
  speed: number;
  duration: number;
  private spawnTime: number;
  private vel: Vec2;
  private active: boolean = true;
  history: Vec2[];

  initPos: Vec2;
  initVel: Vec2;

  xBounds: Vec2;
  yBounds: Vec2;

  constructor(pos: Vec2, dir: Vec2, speed: number, xBounds: Vec2, yBounds: Vec2, r: number = 16, duration: number = 5) {
    this.pos = pos;
    this.dir = dir.normalized();
    this.speed = speed;
    this.duration = duration;
    this.vel = this.dir.scale(this.speed);
    this.r = r;
    this.history = [];
    this.initPos = pos;
    this.initVel = this.vel;
    this.xBounds = xBounds;
    this.yBounds = yBounds;
    this.spawnTime = Date.now();
  }

  update(dt: number) {
    if (!this.active) return;

    if ((Date.now() - this.spawnTime) / 1000 > this.duration) {
      this.active = false;
      return;
    }

    this.pos = this.pos.add(this.vel.scale(dt));

    let normals = new Array<Vec2>();

    if (this.pos.x < this.xBounds.x) {
      this.pos.x = this.xBounds.x;
      normals.push(new Vec2(1, 0));
    } else if (this.pos.x > this.xBounds.y) {
      this.pos.x = this.xBounds.y;
      normals.push(new Vec2(-1, 0));
    }

    if (this.pos.y < this.yBounds.x) {
      this.pos.y = this.yBounds.x;
      normals.push(new Vec2(0, 1));
    } else if (this.pos.y > this.yBounds.y) {
      this.pos.y = this.yBounds.y;
      normals.push(new Vec2(0, -1));
    }

    // line(p, this.pos, this.dir, 2, 30);

    if (normals.length > 0) {
      const angles = normals.map((val) => Math.atan2(val.y, val.x));
      const angleAverage = angles.reduce((prev, cur) => prev + cur, 0) / normals.length;
      const normal = (new Vec2(Math.cos(angleAverage), Math.sin(angleAverage)));

      // line(p, this.pos, normal, 2, 30);

      // Project vel onto normal
      const projectedDir = normal.scale(this.dir.dot(normal));
      const reflectedDir = this.dir.sub(projectedDir.scale(2)).normalized();
      const reflectedVel = reflectedDir.scale(this.speed);
      this.dir = reflectedDir;
      this.vel = reflectedVel;
    }
  }

  draw(p: p5) {
    if (!this.active) return;
    let age = (Date.now() - this.spawnTime) / 1000;
    let alpha = Math.sqrt(clamp(1 - age / this.duration, 0, 1)) * 255;
    drawBall(p, this.pos.x, this.pos.y, this.r, 2, alpha);
  }
}

function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(number, max));
}

function line(p: p5, pos: Vec2, dPos: Vec2, w: number, s: number) {
  p.push();
  p.strokeWeight(w);
  p.line(pos.x, pos.y, pos.x + dPos.x * s, pos.y + dPos.y * s);
  p.pop();
}

function calcImageGrid(canvasSize: Vec2, pos: Vec2, size: Vec2, zoomFactor: number) {
  const zoomedCanvas = canvasSize.scale(1 / zoomFactor);

  let rowsBefore = Math.ceil((zoomedCanvas.y - size.y) / 2 / size.y);
  let colsBefore = Math.ceil((zoomedCanvas.x - size.x) / 2 / size.x);
  let rowCount = 2 * rowsBefore + 1;
  let colCount = 2 * colsBefore + 1;
  let firstPos = new Vec2(pos.x - colsBefore * size.x, pos.y - rowsBefore * size.y);

  let firstXFlip = colsBefore % 2 !== 0;
  let firstYFlip = rowsBefore % 2 !== 0;

  return {
    firstPos: firstPos,
    firstXFlip: firstXFlip,
    firstYFlip: firstYFlip,
    rowCount: rowCount,
    colCount: colCount
  }
}

// Do two axis aligned bounding boxes overlap? Given by center position and extents.
function isOverlapping2D(pos1: Vec2, extents1: Vec2, pos2: Vec2, extents2: Vec2) {
  return isOverlapping1D(pos1.x, extents1.x, pos2.x, extents2.x)
    && isOverlapping1D(pos1.y, extents1.y, pos2.y, extents2.y);
}

function isOverlapping1D(pos1: number, extent1: number, pos2: number, extent2: number) {
  const min1 = pos1 - extent1;
  const max1 = pos1 + extent1;
  const min2 = pos2 - extent2;
  const max2 = pos2 + extent2;
  return !(min1 > max2 || max1 < min2)
}


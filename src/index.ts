import * as p5 from "p5"
import photonImg from "../images/photon.png"

console.log("Entry");

const p5Instance = new p5((p: p5) => {
  let pg: p5.Graphics;
  let ball: Ball;
  let viewData: { firstPos: Vec2; firstXFlip: boolean; firstYFlip: boolean; rowCount: number; colCount: number; };
  let canvasSize: Vec2;
  let viewSize: Vec2;

  p.setup = () => {
    console.log("Setup");

    const canvasWidth = 360;
    const canvasHeight = canvasWidth;
    p.createCanvas(canvasWidth, canvasHeight, p.WEBGL).parent("canvasContainer");
    p.frameRate(60);

    canvasSize = new Vec2(p.width, p.height);
    viewSize = new Vec2(200, 300);
    viewData = calcImageGrid(canvasSize, Vec2.zero, viewSize)

    p.background(255, 0, 255);

    // Setup render texture
    const extra = 0;
    pg = p.createGraphics(viewSize.x + extra, viewSize.y + extra);

    const randAngle = p.random() * 2 * Math.PI;
    const speed = 60;
    ball = new Ball(new Vec2(pg.width / 2, pg.height / 2), new Vec2(Math.cos(randAngle), Math.sin(randAngle)), speed, new Vec2(0, pg.width), new Vec2(0, pg.height));
  };

  p.draw = () => {
    pg.background(200);
    createWalls(pg, viewSize.x, viewSize.y);
    ball.update(pg.deltaTime / 1000, pg);
    ball.draw(pg);

    // Copy to image so we can transform it
    var img = p.createImage(pg.width, pg.height);
    img.copy(pg, 0, 0, pg.width, pg.height, 0, 0, pg.width, pg.height);

    let pos;
    let xFlip = viewData.firstXFlip;
    let yFlip = viewData.firstYFlip;
    p.push();
    p.imageMode(p.CENTER);

    for (let rowIdx = 0; rowIdx < viewData.rowCount; rowIdx++) {
      for (let colIdx = 0; colIdx < viewData.colCount; colIdx++) {
        pos = new Vec2(viewData.firstPos.x + colIdx * pg.width, viewData.firstPos.y + rowIdx * (pg.height));
        p.push();
        p.scale(xFlip ? -1 : 1, yFlip ? -1 : 1);
        p.image(img, pos.x, pos.y);
        p.pop();
        xFlip = !xFlip;
      }
      xFlip = viewData.firstXFlip;
      yFlip = !yFlip;
    }
    p.pop();
  };
});

function createBall(p: p5, x: number, y: number, r: number, s: number) {
  p.push();
  p.strokeWeight(s);
  p.drawingContext.shadowOffsetX = 5;
  p.drawingContext.shadowOffsetY = -5;
  p.drawingContext.shadowBlur = 10;
  p.drawingContext.shadowColor = "black";
  p.ellipse(x, y, r * 2, r * 2);
  p.pop();
}

function createWalls(p: p5, w: number, h: number) {
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

  mag(other: Vec2): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
}

class Ball {
  r: number;
  pos: Vec2;
  dir: Vec2;
  speed: number;
  private vel: Vec2;
  history: Vec2[];

  initPos: Vec2;
  initVel: Vec2;

  xBounds: Vec2;
  yBounds: Vec2;

  constructor(pos: Vec2, dir: Vec2, speed: number, xBounds: Vec2, yBounds: Vec2, r: number = 16) {
    this.pos = pos;
    this.dir = dir.normalized();
    this.speed = speed;
    this.vel = this.dir.scale(this.speed);
    this.r = r;
    this.history = [];
    this.initPos = pos;
    this.initVel = this.vel;
    this.xBounds = xBounds;
    this.yBounds = yBounds;
  }

  update(dt: number, p: p5) {
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
    createBall(p, this.pos.x, this.pos.y, this.r, 2);
  }
}

function line(p: p5, pos: Vec2, dPos: Vec2, w: number, s: number) {
  p.push();
  p.strokeWeight(w);
  p.line(pos.x, pos.y, pos.x + dPos.x * s, pos.y + dPos.y * s);
  p.pop();
}

function calcImageGrid(canvasSize: Vec2, pos: Vec2, size: Vec2) {
  let rowsBefore = 0;
  let rowsAfter = 0;
  let colsBefore = 0;
  let colsAfter = 0;

  const canvasExtents = canvasSize.scale(0.5);
  const extents = size.scale(0.5);

  let testPos = new Vec2(pos.x, pos.y - size.y);
  while (isOverlapping2D(Vec2.zero, canvasExtents, testPos, extents)) {
    rowsBefore++;
    testPos.y -= size.y
  }

  testPos = new Vec2(pos.x, pos.y + size.y);
  while (isOverlapping2D(Vec2.zero, canvasExtents, testPos, extents)) {
    rowsAfter++;
    testPos.y += size.y
  }

  testPos = new Vec2(pos.x - size.x, pos.y);
  while (isOverlapping2D(Vec2.zero, canvasExtents, testPos, extents)) {
    colsBefore++;
    testPos.x -= size.x
  }

  testPos = new Vec2(pos.x + size.x, pos.y);
  while (isOverlapping2D(Vec2.zero, canvasExtents, testPos, extents)) {
    colsAfter++;
    testPos.x += size.x
  }

  let firstPos = new Vec2(pos.x - rowsBefore * size.x, pos.y - colsBefore * size.y);
  let firstXFlip = rowsBefore % 2 !== 0;
  let firstYFlip = colsBefore % 2 !== 0;
  let rowCount = rowsBefore + 1 + rowsAfter;
  let colCount = colsBefore + 1 + colsAfter;

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

// function mousePressed(event) {
//   console.log(event);
//   console.log(windowWidth);
//   console.log(displayWidth);
//   fullscreen(!fullscreen());
//   return false;
// }

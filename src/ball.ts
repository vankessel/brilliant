import * as p5 from "p5";
import 'p5/lib/addons/p5.sound';
import { clamp } from "./math";
import Vec2 from "./vec2";

export default class Ball {
    radius: number;
    pos: Vec2;
    prevPos: Vec2;
    dir: Vec2;
    speed: number;
    duration: number;
    vel: Vec2;
    private spawnTime: number;
    private active: boolean = true;
    private spawnedThisFrame: boolean = true;
    private ballSpawnSounds: p5.SoundFile[];

    initPos: Vec2;
    initVel: Vec2;
    firstContactTime: number;
    contactHistory: Vec2[];

    xBounds: Vec2;
    yBounds: Vec2;

    constructor(pos: Vec2, dir: Vec2, speed: number, xBounds: Vec2, yBounds: Vec2, ballSpawnSounds: p5.SoundFile[] = [], radius: number = 8, duration: number = 5, active: boolean = true) {
        this.construct(pos, dir, speed, xBounds, yBounds, ballSpawnSounds, radius, duration, active)
    }

    construct(pos: Vec2, dir: Vec2, speed: number, xBounds: Vec2, yBounds: Vec2, ballSpawnSounds: p5.SoundFile[] = [], radius: number = 8, duration: number = 5, active: boolean = true) {
        this.pos = pos;
        this.prevPos = Vec2.zero;
        this.dir = dir.normalized();
        this.speed = speed;
        this.duration = duration;
        this.vel = this.dir.scale(this.speed);
        this.radius = radius;
        this.contactHistory = [];
        this.initPos = pos;
        this.initVel = this.vel;
        this.xBounds = xBounds;
        this.yBounds = yBounds;
        this.spawnTime = Date.now();
        this.active = active;
        this.spawnedThisFrame = true;
        this.ballSpawnSounds = ballSpawnSounds;
    }

    setActive(active: boolean) {
        this.active = active;
        this.spawnTime = Date.now();
    }

    playRandomSpawnSound(pan: number) {
        // const sound = this.ballSpawnSounds[Math.trunc(Math.random() * this.ballSpawnSounds.length)];
        // sound.setVolume(0.1);
        // sound.pan(pan);
        // if (sound.isLoaded) {
        //     sound.play();
        // } else {
        //     console.log("Sound not loaded!");
        // }
    }

    update(dt: number) {
        if (!this.active) return;

        if ((Date.now() - this.spawnTime) / 1000 > this.duration) {
            this.active = false;
            return;
        }

        let normals = new Array<Vec2>();
        let testPos = this.pos.copy();

        // x = 0
        if (this.pos.x < this.xBounds.x) {
            let upper = this.pos;
            let lower = this.prevPos;
            testPos = upper.add(lower).scale(0.5);
            const epsilon = 0.5;
            while (Math.abs(testPos.x - this.xBounds.x) > epsilon) {
                console.log(Math.abs(testPos.x - this.xBounds.x));

                // TestPos is closer to pos
                if (testPos.x < this.xBounds.x) {
                    upper = testPos;
                } else {
                    lower = testPos;
                }
                testPos = upper.add(lower).scale(0.5);
            }

            normals.push(new Vec2(1, 0));
            // x = w
        } else if (this.pos.x > this.xBounds.y) {
            let upper = this.pos;
            let lower = this.prevPos;
            testPos = upper.add(lower).scale(0.5);
            const epsilon = 0.5;
            while (Math.abs(testPos.x - this.xBounds.y) > epsilon) {
                // TestPos is closer to pos
                if (testPos.x > this.xBounds.y) {
                    upper = testPos;
                } else {
                    lower = testPos;
                }
                testPos = upper.add(lower).scale(0.5);
            }

            normals.push(new Vec2(-1, 0));
        }
        this.pos = testPos.copy();

        // y = 0
        if (this.pos.y < this.yBounds.x) {
            let upper = this.pos;
            let lower = this.prevPos;
            testPos = upper.add(lower).scale(0.5);
            const epsilon = 0.5;
            while (Math.abs(testPos.y - this.yBounds.x) > epsilon) {
                // TestPos is closer to pos
                if (testPos.y < this.yBounds.x) {
                    upper = testPos;
                } else {
                    lower = testPos;
                }
                testPos = upper.add(lower).scale(0.5);
            }

            normals.push(new Vec2(0, 1));
            // y = h
        } else if (this.pos.y > this.yBounds.y) {
            let upper = this.pos;
            let lower = this.prevPos;
            testPos = upper.add(lower).scale(0.5);
            const epsilon = 0.5;
            while (Math.abs(testPos.y - this.yBounds.y) > epsilon) {
                // TestPos is closer to pos
                if (testPos.y > this.yBounds.y) {
                    upper = testPos;
                } else {
                    lower = testPos;
                }
                testPos = upper.add(lower).scale(0.5);
            }

            normals.push(new Vec2(0, -1));
        }
        this.pos = testPos.copy();
        // line(p, this.pos, this.dir, 2, 30);

        if (!this.spawnedThisFrame && normals.length > 0) {
            if (this.contactHistory.length === 0) {
                this.firstContactTime = Date.now();
            }
            this.contactHistory.push(this.pos.copy())
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

        if (this.spawnedThisFrame) {
            this.spawnedThisFrame = false;
            this.initPos = this.pos;
            this.initVel = this.vel;
            const pan = ((this.pos.x - this.xBounds.x) / (this.xBounds.y - this.xBounds.x)) * 2 - 1
            this.playRandomSpawnSound(pan);
        }

        this.prevPos = this.pos;
        this.pos = this.pos.add(this.vel.scale(dt));
    }

    draw(p: p5, p2: p5) {
        if (!this.active) return;
        let age = (Date.now() - this.spawnTime) / 1000;
        let alpha = Math.sqrt(clamp(1 - age / this.duration, 0, 1)) * 255;
        drawBall(p, this, 2, alpha);
        let offset = new Vec2((p2.width - p.width) / 2, (p2.height - p.height) / 2);
        drawPath(p2, this, offset, alpha);
    }

    *pathPoints(): Generator<Vec2, void, unknown> {
        for (let idx = 0; idx < this.contactHistory.length; idx++) {
            yield this.contactHistory[idx];
        }
        yield this.pos;
    }
}

function drawPath(p: p5, b: Ball, offset: Vec2 = Vec2.zero, a: number) {
    p.push();
    p.stroke(0, 0, 30, a);
    p.strokeWeight(3);
    let prevPos = b.initPos.add(offset);
    for (const pathPos of b.pathPoints()) {
        const pos = pathPos.add(offset);
        p.line(prevPos.x, prevPos.y, pos.x, pos.y);
        prevPos = pos;
    }
    if (b.contactHistory.length > 0) {
        p.stroke(0, 255, 255, a);
        const sinceFirstContact = (Date.now() - b.firstContactTime) / 1000;
        const firstContact = b.contactHistory[0].add(offset);
        const estimatedPos = firstContact.add(b.initVel.scale(sinceFirstContact));
        p.line(firstContact.x, firstContact.y, estimatedPos.x, estimatedPos.y);
        b.firstContactTime;
    }
    p.pop();
}

function drawBall(p: p5, b: Ball, s: number, a: number = 255) {
    p.push();
    p.fill(254, 223, 83, a);
    p.stroke(51, a);
    p.strokeWeight(s);
    // p.drawingContext.shadowOffsetX = 5;
    // p.drawingContext.shadowOffsetY = -5;
    // p.drawingContext.shadowBlur = 10;
    // p.drawingContext.shadowColor = "black";
    p.ellipse(b.pos.x, b.pos.y, b.radius * 2, b.radius * 2);
    p.imageMode(p.CENTER);
    // let side = Math.max(img.width, img.height);
    // let scale = 2 * r / side;
    // p.scale(scale)
    // p.image(img, x/scale, y/scale);
    p.pop();
}
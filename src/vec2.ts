export default class Vec2 {
    static readonly zero = new Vec2(0, 0);

    x: number;
    y: number;

    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }

    copy() {
      return new Vec2(this.x, this.y);
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

    mult(other: Vec2): Vec2 {
      return new Vec2(this.x * other.x, this.y * other.y);
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
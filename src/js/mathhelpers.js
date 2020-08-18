class Vec2 {
        constructor(x, y) {
                this.x = x;
                this.y = y;
        }

        addEq(x, y) {
                this.x += x;
                this.y += y;
        }
        mulEqScalar(a) {
                this.x *= a;
                this.y *= a;
        }
        mul(a) {
                return new Vec2(this.x * a, this.y * a);
        }
        mixEq(x, y, t) {
                this.x = this.x * (1 - t) + x * t;
                this.y = this.y * (1 - t) + y * t;
        }
        len() {
                return Math.sqrt(this.x * this.x + this.y * this.y);
        }
        dot(v) {
                return this.x * v.x + this.y * v.y;
        }
        set(x, y) {
                this.x = x
                this.y = y
        }
}
function Vec2(x, y) {
        this.x = x;
        this.y = y;
}

Vec2.prototype = {
        addEq: function (x, y) {
                this.x += x;
                this.y += y;
        },
        mulEqScalar: function (a) {
                this.x *= a;
                this.y *= a;
        },
        mixEq: function (x, y, t) {
                this.x = this.x * (1 - t) + x * t;
                this.y = this.y * (1 - t) + y * t;
        },
        len: function () {
                return Math.sqrt(this.x * this.x + this.y * this.y);
        },
        s: function (x, y) {
                this.x = x;
                this.y = y;
        },
}

import Vector from "./Vector";

export default class VirtualCanvas {
    private data = [];

    private bounding = [
        new Vector(0, 0),
        new Vector(0, 0),
    ];

    public setPixel(x: number, y: number, val: boolean) {
        x = Math.floor(x);
        y = Math.floor(y);

        this.data[x] = this.data[x] || [];
        this.data[x][y] = val;

        if (val) {
            this.updateBounding(x, y);
        }
    }

    public check(x: number, y: number) {
        x = Math.floor(x);
        y = Math.floor(y);

        this.data[x] = this.data[x] || [];
        return this.data[x][y];
    }

    public clear() {
        this.data = [];
        this.bounding = [
            new Vector(0, 0),
            new Vector(0, 0),
        ];
    }

    public getBounding() {
        const offset = new Vector(5, 5);

        return [
            this.bounding[0].copy().sub(offset),
            this.bounding[1].copy().add(offset),
        ];
    }

    private updateBounding(x: number, y: number) {
        if (x < this.bounding[0].x) this.bounding[0].x = x;
        else if (x > this.bounding[1].x) this.bounding[1].x = x;

        if (y < this.bounding[0].y) this.bounding[0].y = y;
        else if (y > this.bounding[1].y) this.bounding[1].y = y;
    }
}
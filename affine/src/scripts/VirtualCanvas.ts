import Vector from "./Vector";

export default class VirtualCanvas {
    private data = [];

    private bounding = [
        new Vector(0, 0),
        new Vector(0, 0),
    ];

    public setPixel(_x: number, _y: number, val: boolean) {
        let x = Math.floor(_x);
        let y = Math.floor(_y);

        this.data[x] = this.data[x] || [];
        this.data[x][y] = val;

        if (val) {
            this.updateBounding(x, y);
        }
    }

    public check(x: number, y: number) {
        x = Math.floor(x);
        y = Math.floor(y);

        return (x in this.data) ? this.data[x][y] : false;
    }

    public clear() {
        this.data = [];
        this.bounding = [
            new Vector(0, 0),
            new Vector(0, 0),
        ];
    }

    public getBounding() {
        const offset = new Vector(2, 2);

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
import Vector from "./Vector";

export default class VirtualCanvas {
    private data = [];

    public setPixel(x: number, y: number, val: boolean) {
        x ^= 0;
        y ^= 0;

        this.data[x] = this.data[x] || [];
        this.data[x][y] = val;
    }

    public check(x: number, y: number) {
        x ^= 0;
        y ^= 0;

        return (x in this.data) ? this.data[x][y] : false;
    }

    public clear() {
        this.data = [];
    }
}
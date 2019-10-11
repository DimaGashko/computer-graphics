export default class VirtualCanvas {
    private data = [];

    public setPixel(x: number, y: number, val: boolean) {
        this.data[x] = this.data[x] || [];
        this.data[x] = val;
    }

    public check(x: number, y: number) {
        this.data[x] = this.data[x] || [];
        return this.data[x];
    }

    public clear() { 
        this.data = [];
    }
}
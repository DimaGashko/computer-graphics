import TMatrix from "../scripts/TMatrix";

export default abstract class Geometry {
    private center: { x: number, y: number, z: number } = null;

    constructor(public tMatrix: TMatrix = new TMatrix()) {

    }

    public abstract get vertices(): Float32Array;
    public abstract get colors(): Uint8Array;

    public get primitiveCount() {
        return this.vertices.length / 3;
    }

    public get centerX() {
        if (!this.center) this.findCenter();
        return this.center.x;
    }

    public get centerY() {
        if (!this.center) this.findCenter();
        return this.center.y;
    }

    public get centerZ() {
        if (!this.center) this.findCenter();
        return this.center.z;
    }

    private findCenter() {
        const vs = this.vertices;
        let x = 0;
        let y = 0;
        let z = 0;

        for (let i = 0; i < vs.length; i += 3) {
            if (vs[i] > x) x = vs[i];
            if (vs[i + 1] > x) x = vs[i + 1];
            if (vs[i + 2] > x) x = vs[i + 2];
        };

        this.center = { x, y, z };
    }

}
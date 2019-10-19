import TMatrix from "../scripts/TMatrix/TMatrix";

export default abstract class Geometry {
    constructor(public tMatrix: TMatrix = new TMatrix()) {

    }

    public abstract get vertices(): Float32Array;
    public abstract get colors(): Uint8Array;

    public get primitiveCount() {
        return this.vertices.length / 3;
    }
}
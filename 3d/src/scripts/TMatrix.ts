import { makeIdentity, makeTranslation, makeShear, makeRotateX, makeRotateY, makeRotateZ, makePerspective, makeReflect, makeScale } from "./affine";
import matMulMat4 from "./math/matMulMat4";
import mat4Inverse from "./math/mar4Inverse";

export default class TMatrix {
    constructor(private _affine: number[] = makeIdentity()) {

    }

    public reset(affine: number[] = makeIdentity()) {
        this._affine = affine;
        return this;
    }

    public copy() {
        const tMatrix = new TMatrix();
        tMatrix.setTMatrix(this.matrix);
        return tMatrix;
    }

    public setTMatrix(tMatrixRaw: number[]) {
        this._affine = tMatrixRaw.slice(0, 16);
    }

    public translate(dx: number, dy: number, dz: number) {
        this._affine = matMulMat4(makeTranslation(dx, dy, dz), this._affine);
        return this;
    }

    public scale(cx: number, cy: number, cz: number) {
        this._affine = matMulMat4(makeScale(cx, cy, cz), this._affine);
        return this;
    }

    public shear(xy: number, yx: number, xz: number, zx: number, yz: number, zy: number) {
        this._affine = matMulMat4(makeShear(xy, yx, xz, zx, yz, zy), this._affine);
        return this;
    }

    public rotateX(deg: number) {
        this._affine = matMulMat4(makeRotateX(deg), this._affine);
        return this;
    }

    public rotateY(deg: number) {
        this._affine = matMulMat4(makeRotateY(deg), this._affine);
        return this;
    }

    public rotateZ(deg: number) {
        this._affine = matMulMat4(makeRotateZ(deg), this._affine);
        return this;
    }

    public reflect(cx: boolean, cy: boolean, cz: boolean) {
        this._affine = matMulMat4(makeReflect(cx, cy, cz), this._affine);
        return this;
    }

    public perspective(fieldOfView: number, aspect: number, near: number, far: number) {
        this._affine = matMulMat4(makePerspective(fieldOfView, aspect, near, far), this._affine);
        return this;
    }

    public inverse() {
        this._affine = mat4Inverse(this._affine);
        return this;
    }

    public customMatrix(matrix: number[]) {
        this._affine = matMulMat4(matrix, this._affine);
        return this;
    }

    public get matrix() {
        return [...this._affine];
    }
}
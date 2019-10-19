import { makeIdentity, makeTranslation, makeShear, makeRotateX, makeRotateY, makeRotateZ, makePerspective, makeReflect, makeScale } from "./affine";
import matMulMat4 from "../math/matMulMat4";

export default class TMatrix {
    private _affine = makeIdentity();

    private _affineStack = [];

    public save() {
        this._affineStack.push([...this._affine]);
    }
    
    public restore() { 
        this._affine = this._affineStack.pop();
    }

    public reset() { 
        this._affine = makeIdentity();
    }

    public translate(dx: number, dy: number, dz: number) {
        this._affine = matMulMat4(makeTranslation(dx, dy, dz), this._affine);
    }

    public scale(cx: number, cy: number, cz: number) {
        this._affine = matMulMat4(makeScale(cx, cy, cz), this._affine);
    }

    public shear(xy: number, yx: number, xz: number, zx: number, yz: number, zy: number) {
        this._affine = matMulMat4(makeShear(xy, yx, xz, zx, yz, zy), this._affine);
    }

    public rotateX(deg: number) {
        this._affine = matMulMat4(makeRotateX(deg), this._affine);
    }

    public rotateY(deg: number) {
        this._affine = matMulMat4(makeRotateY(deg), this._affine);
    }

    public rotateZ(deg: number) {
        this._affine = matMulMat4(makeRotateZ(deg), this._affine);
    }

    public reflect(cx: boolean, cy: boolean, cz: boolean) {
        this._affine = matMulMat4(makeReflect(cx, cy, cz), this._affine);
    }

    public perspective(fieldOfView: number, aspect: number, near: number, far: number) {
        this._affine = matMulMat4(makePerspective(fieldOfView, aspect, near, far), this._affine);
    }

    public get raw() {
        return [...this._affine];
    }
}
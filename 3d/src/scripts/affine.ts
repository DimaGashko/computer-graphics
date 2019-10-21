
export function makeIdentity() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

export function makeTranslation(dx: number, dy: number, dz: number) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        dx, dy, dz, 1,
    ];
}

export function makeScale(cx: number, cy: number, cz: number) {
    return [
        cx, 0, 0, 0,
        0, cy, 0, 0,
        0, 0, cz, 0,
        0, 0, 0, 1,
    ];
}

export function makeShear(xy: number, yx: number, xz: number, zx: number, yz: number, zy: number) {
    return [
        1, xy, xz, 0,
        yx, 1, yz, 0,
        zx, zy, 1, 0,
        0, 0, 0, 1,
    ];
}

export function makeRotateX(deg: number) {
    return [
        1, 0, 0, 0,
        0, Math.cos(deg), -Math.sin(deg), 0,
        0, Math.sin(deg), Math.cos(deg), 0,
        0, 0, 0, 1,
    ];
}

export function makeRotateY(deg: number) {
    return [
        Math.cos(deg), 0, Math.sin(deg), 0,
        0, 1, 0, 0,
        -Math.sin(deg), 0, Math.cos(deg), 0,
        0, 0, 0, 1,
    ];
}

export function makeRotateZ(deg: number) {
    return [
        Math.cos(deg), -Math.sin(deg), 0, 0,
        Math.sin(deg), Math.cos(deg), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

export function makeReflect(cx: boolean, cy: boolean, cz: boolean) {
    return [
        (cx ? -1 : 1), 0, 0, 0,
        0, (cy ? -1 : 1), 0, 0,
        0, 0, (cz ? -1 : 1), 0,
        0, 0, 0, 1,
    ];
}

export function makePerspective(fieldOfView: number, aspect: number, near: number, far: number) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfView);
    var rangeInv = 1 / (near - far);

    return [
        f / aspect, 0, 0, 0,
        0, -f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
}

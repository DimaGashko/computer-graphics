
export function identity() {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

export function translate(dx: number, dy: number, dz: number) {
    return [
        1, 0, 0, dx,
        0, 1, 0, dy,
        0, 0, 1, dz,
        0, 0, 0, 1,
    ];
}

export function scale(cx: number, cy: number, cz: number) {
    return [
        cx, 0, 0, 0,
        0, cy, 0, 0,
        0, 0, cz, 0,
        0, 0, 0, 1,
    ];
}

export function shear(xy: number, yx: number, xz: number, zx: number, yz: number, zy: number) {
    return [
        1, xy, xz, 0,
        yx, 1, yz, 0,
        zx, zy, 1, 0,
        0, 0, 0, 1,
    ];
}

export function rotateX(deg: number) {
    return [
        1, 0, 0, 0,
        0, Math.cos(deg), -Math.sin(deg), 0,
        0, Math.sin(deg), Math.cos(deg), 0,
        0, 0, 0, 1,
    ];
}

export function rotateY(deg: number) {
    return [
        Math.cos(deg), 0, Math.sin(deg), 0,
        0, 1, 0, 0,
        -Math.sin(deg), 0, Math.cos(deg), 0,
        0, 0, 0, 1,
    ];
}

export function rotateZ(deg: number) {
    return [
        Math.cos(deg), -Math.sin(deg), 0, 0,
        Math.sin(deg), Math.cos(deg), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ];
}

export function reflect(cx: boolean, cy: boolean, cz: boolean) {
    return [
        (cx ? -1 : 1), 0, 0, 0,
        0, (cy ? -1 : 1), 0, 0,
        0, 0, (cz ? -1 : 1), 0,
        0, 0, 0, 1,
    ];
}
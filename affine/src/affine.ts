export function scale(cx: number, cy: number) {
    return [
        [cx, 0, 0],
        [0, cy, 0],
        [0, 0, 1],
    ];
}

export function translate(dx: number, dy: number) {
    return [
        [1, 0, dx],
        [0, 1, dy],
        [0, 0, 1],
    ];
}

export function shear(cx: number, cy: number) {
    return [
        [1, cx, 0],
        [cy, 1, 0],
        [0, 0, 1],
    ];
}


export function reflection(x: boolean, y: boolean) {
    return [
        [x ? -1 : 1, 0, 0],
        [0, y ? -1 : 1, 0],
        [0, 0, 1],
    ];
}

export function rotate(a: number) {
    return [
        [Math.cos(a), -Math.sin(a), 0],
        [Math.sin(a), Math.cos(a), 0],
        [0, 0, 1],
    ];
}
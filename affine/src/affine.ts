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
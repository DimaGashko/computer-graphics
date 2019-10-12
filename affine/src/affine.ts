export function scale(cx: number, cy: number) {
    return [
        [cx, 0, 0],
        [0, cy, 0],
        [0, 0, 1],
    ];
}

export function translate(dx: number, dy: number) {
    const a =-1.08;
    return [
        [Math.cos(a), -Math.sin(a), 0],
        [Math.sin(a), Math.cos(a), 0],
        [0, 0, 1],
    ];
}
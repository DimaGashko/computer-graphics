/**
 *```js
 * matrixMulNum([
 *    [2, 4, 0],
 *    [-2, 1, 3],
 *    [-1, 0, 1],
 * 
 * ], [1, 2, -1]); 
 * // [10, -3, -2],
 * ```
*/
export default function matrix3x3MulVec(a: number[][], b: number[]): number[] {
    return [
        a[0][0] * b[0] + a[0][1] * b[1] + a[0][2] * b[2],
        a[1][0] * b[0] + a[1][1] * b[1] + a[1][2] * b[2],
        a[2][0] * b[0] + a[2][1] * b[1] + a[2][2] * b[2]
    ];
}
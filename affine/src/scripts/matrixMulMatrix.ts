/**
 *```js
 * matrixMulNum([
 *    [1, -1],
 *    [2, 0],
 *    [3, 0],
 * ], [
 *  [1, 1],
 *  [2, 0],
 * ]); 
 * // [-1, 1],
 * // [2, 2],
 * // [3, 3],
*/
export default function matrixMulMatrix(a: number[][], b: number[][]): number[][] {
    const m1 = a.length;
    const m2 = b.length;

    if (m1 && a[0].length !== m2) {
        throw new TypeError('Matrices are inconsistent');
    }

    const n2 = b[0].length;

    const res = new Array(m1);
    for (let i = 0; i < m1; i++) {
        res[i] = new Array(n2);
    }

    for (let i = 0; i < n2; i++) {

        for (let j = 0; j < m1; j++) {
            let item = 0;

            for (let k = 0; k < m2; k++) {
                item += a[j][k] * b[k][i];
            }

            res[j][i] = item;
        }

    }

    return res;
}

export default function copyMatrix(matrix: number[][]): number[][] {
    return matrix.map(r => [...r]);
}
// Original: https://snipplr.com/view/101612/

export default function invert3x3Matrix(matrix: number[][]): number[][] {
    const a = matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1];
    const b = matrix[1][2] * matrix[2][0] - matrix[1][0] * matrix[2][2];
    const c = matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0];
    const determinant = matrix[0][0] * a + matrix[0][1] * b + matrix[0][2] * c;

    // Singular; inverse does not exist
    if (determinant === 0) {
        return null;
    }

    return [[
        a,
        (matrix[0][2] * matrix[2][1] - matrix[0][1] * matrix[2][2]),
        (matrix[0][1] * matrix[1][2] - matrix[0][2] * matrix[1][1]),
    ], [
        b,
        (matrix[0][0] * matrix[2][2] - matrix[0][2] * matrix[2][0]),
        (matrix[0][2] * matrix[1][0] - matrix[0][0] * matrix[1][2]),
    ], [
        c,
        (matrix[0][1] * matrix[2][0] - matrix[0][0] * matrix[2][1]),
        (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0])
    ]].map(row => row.map(col => col / determinant));
};
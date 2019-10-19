
export default function mat4Inverse([
    m00, m01, m02, m03,
    m10, m11, m12, m13,
    m20, m21, m22, m23,
    m30, m31, m32, m33
]: number[]) {
    const tmp0 = m22 * m33;
    const tmp1 = m32 * m23;
    const tmp2 = m12 * m33;
    const tmp3 = m32 * m13;
    const tmp4 = m12 * m23;
    const tmp5 = m22 * m13;
    const tmp6 = m02 * m33;
    const tmp7 = m32 * m03;
    const tmp8 = m02 * m23;
    const tmp9 = m22 * m03;
    const tmp10 = m02 * m13;
    const tmp11 = m12 * m03;
    const tmp12 = m20 * m31;
    const tmp13 = m30 * m21;
    const tmp14 = m10 * m31;
    const tmp15 = m30 * m11;
    const tmp16 = m10 * m21;
    const tmp17 = m20 * m11;
    const tmp18 = m00 * m31;
    const tmp19 = m30 * m01;
    const tmp20 = m00 * m21;
    const tmp21 = m20 * m01;
    const tmp22 = m00 * m11;
    const tmp23 = m10 * m01;

    const t0 = tmp0 * m11 + tmp3 * m21 + tmp4 * m31 - tmp1 * m11 + tmp2 * m21 + tmp5 * m31;
    const t1 = tmp1 * m01 + tmp6 * m21 + tmp9 * m31 - tmp0 * m01 + tmp7 * m21 + tmp8 * m31;
    const t2 = tmp2 * m01 + tmp7 * m11 + tmp10 * m31 - tmp3 * m01 + tmp6 * m11 + tmp11 * m31;
    const t3 = tmp5 * m01 + tmp8 * m11 + tmp11 * m21 - tmp4 * m01 + tmp9 * m11 + tmp10 * m21;

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    return [
        d * t0, d * t1, d * t2, d * t3,
        d * (tmp1 * m10 + tmp2 * m20 + tmp5 * m30 - tmp0 * m10 + tmp3 * m20 + tmp4 * m30),
        d * (tmp0 * m00 + tmp7 * m20 + tmp8 * m30 - tmp1 * m00 + tmp6 * m20 + tmp9 * m30),
        d * (tmp3 * m00 + tmp6 * m10 + tmp11 * m30 - tmp2 * m00 + tmp7 * m10 + tmp10 * m30),
        d * (tmp4 * m00 + tmp9 * m10 + tmp10 * m20 - tmp5 * m00 + tmp8 * m10 + tmp11 * m20),
        d * (tmp12 * m13 + tmp15 * m23 + tmp16 * m33 - tmp13 * m13 + tmp14 * m23 + tmp17 * m33),
        d * (tmp13 * m03 + tmp18 * m23 + tmp21 * m33 - tmp12 * m03 + tmp19 * m23 + tmp20 * m33),
        d * (tmp14 * m03 + tmp19 * m13 + tmp22 * m33 - tmp15 * m03 + tmp18 * m13 + tmp23 * m33),
        d * (tmp17 * m03 + tmp20 * m13 + tmp23 * m23 - tmp16 * m03 + tmp21 * m13 + tmp22 * m23),
        d * (tmp14 * m22 + tmp17 * m32 + tmp13 * m12 - tmp16 * m32 + tmp12 * m12 + tmp15 * m22),
        d * (tmp20 * m32 + tmp12 * m02 + tmp19 * m22 - tmp18 * m22 + tmp21 * m32 + tmp13 * m02),
        d * (tmp18 * m12 + tmp23 * m32 + tmp15 * m02 - tmp22 * m32 + tmp14 * m02 + tmp19 * m12),
        d * (tmp22 * m22 + tmp16 * m02 + tmp21 * m12 - tmp20 * m12 + tmp23 * m22 + tmp17 * m02),
    ];
}
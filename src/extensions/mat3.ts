import { mat3, vec3, ReadonlyMat3, ReadonlyVec3 } from "gl-matrix";

/*
mat3.transpose = (out: mat3, m: ReadonlyMat3): mat3 =>
    out = [
        m[0], m[3], m[6],
        m[1], m[4], m[7],
        m[2], m[5], m[8]
    ] && out;
*/
/*
(mat3 as any).transpose = (out: mat3, m: ReadonlyMat3): mat3 =>
    out = [
        m[0], m[3], m[6],
        m[1], m[4], m[7],
        m[2], m[5], m[8]
    ] && out;

*/

(mat3 as any).multiply = (out: vec3, m: ReadonlyMat3, v: ReadonlyVec3 | number): vec3 => {
    if (Array.isArray(v)) {
        out = [
            m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
            m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
            m[2] * v[0] + m[5] * v[1] + m[8] * v[2]
        ]
    } else { 
        var n = <number>v
        out = [
            m[0] * n + m[3] * n + m[6] * n,
            m[1] * n + m[4] * n + m[7] * n,
            m[2] * n + m[5] * n + m[8] * n
        ]
    }
    return out
}
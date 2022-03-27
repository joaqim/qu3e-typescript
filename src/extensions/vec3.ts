import { ReadonlyMat3, ReadonlyVec3, vec3 } from "gl-matrix"

declare module "gl-matrix" {
    export module vec3 {
        export function abs(v: vec3): vec3;
        export function multiply(out: vec3, a: ReadonlyMat3, b: ReadonlyVec3): vec3;
        export function multiply(out: vec3, a: ReadonlyVec3, b: number): vec3;
    }
}

(vec3 as any).abs = (v: ReadonlyVec3) => [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])];

(vec3 as any).multiply = (out: vec3, a: ReadonlyVec3, b: ReadonlyVec3 | number): vec3 => {
    if (Array.isArray(b)) {
        const v = <ReadonlyVec3>b
        out = [a[0] * v[0], a[1] * v[1], a[2] * v[2]]
    } else {
        var n = <number>b
        out = [a[0] * n, a[1] * n, a[2] * n]
    }
    return out
}
import { mat3 } from "gl-matrix";

declare module "gl-matrix" {
    namespace mat3 {
        //type Multiply = (out: mat3, m: ReadonlyMat3) => mat3
        //type Multiply = (out: vec3, m: ReadonlyMat3, v: ReadonlyVec3) => mat3
        //const multiply: Multiply
        export function multiply(out: mat3, m: ReadonlyMat3, v: ReadonlyVec3 | number): mat3
    }
    export module mat3 {
        //export function transpose(out: mat3, m: ReadonlyMat3): mat3
        /**
        * Multiplies mat3 with a vec3
        *
        * @param {vec3} out the receiving matrix
        * @param {ReadonlyMat3} m the matrix to multiply
        * @param {ReadonlyVec3} v the vector to multiply
        * @returns {mat3} out
        */
        export function multiply(out: mat3, m: ReadonlyMat3, v: ReadonlyVec3 | number): mat3
    }
}
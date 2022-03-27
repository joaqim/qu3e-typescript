import { mat3, vec3 } from "gl-matrix";

export type Transform = {
    position: vec3
    rotation: mat3
}

export module Transform {
    export function MulT(r: mat3 | Transform, v: vec3): vec3 {
        if ((<Transform>r).rotation) {
            return vec3.add(v, vec3.multiply(v, (<Transform>r).rotation, v), (<Transform>r).position)
        } else {
            return vec3.multiply(v, mat3.transpose(<mat3>r,<mat3>r), v)
        }
    }

}
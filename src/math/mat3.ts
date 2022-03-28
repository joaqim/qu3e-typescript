import { FixedArray } from "@containers"
/*
export class Vec3 {
    x: number
    y: number
    z: number

    constructor(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }

    Set(x: number, y: number, z: number) {
        this.x = x
        this.y = y
        this.z = z
    }
}
*/


/*
interface Matrix3 {
[key in mat3keys]: Vec3[]
}
*/

const possibleTypes = (<T extends number[]>(...o: T) => o)(0, 1, 2);

type Types = Record<typeof possibleTypes[number], boolean>

type Vector3 = [x: number, y: number, z: number]

type Vec3Keys = 'x' | 'y' | 'z'
type Vec3Values = {
    [key in Vec3Keys]: number
}
export class Vec3 {
    v: Vec3Values


    constructor(values: Vec3Values) {
        this.v = values
    }

    Set(x: number, y: number, z: number): Vec3 {
        this.v = { x, y, z }
        return this
    }
}

type Mat3Keys =
    'a' | 'b' | 'c' |
    'd' | 'e' | 'f' |
    'g' | 'h' | 'i';

type Matrix3 = {
    [key in Mat3Keys]: number
}

export class Mat3 {
    values: {
        a: number, b: number, c: number,
        d: number, e: number, f: number,
        g: number, h: number, i: number
    };

    constructor(values: Matrix3) {
        this.values = values
    }

    SetCells(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) {
        this.values = {
            a, b, c,
            d, e, f,
            g, h, i
        }
    }

    Set(axis: Vec3, angle: number) {
        const s = Math.sin(angle)
        const c = Math.cos(angle)
        const x = axis.v.x
        const y = axis.v.y
        const z = axis.v.z
        const xy = x * y
        const yz = y * z
        const zx = z * x
        const t = 1 - c

        this.SetCells(
            x * x * t + c, xy * t + z * s, zx * t - y * s,
            xy * t - z * s, y * y * t + c, yz * t + x * s,
            zx * t + y * s, yz * t - x * s, z * z * t + c
        )
    }

    SetRows(v1: Vec3, v2: Vec3, v3: Vec3) {
        this.SetCells(
            v1.v.x, v1.v.y, v1.v.z,
            v2.v.x, v2.v.y, v2.v.z,
            v3.v.x, v3.v.y, v3.v.z,
        )
    }


}
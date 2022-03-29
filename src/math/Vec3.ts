/**
 *     Qu3e Physics Engine - Typescript Version 1.0
 *     
 *     Copyright (c) 2014 Randy Gaul http://www.randygaul.net
 * 
 * 	This software is provided 'as-is', without any express or implied
 * 	warranty. In no event will the authors be held liable for any damages
 * 	arising from the use of this software.
 * 
 * 	Permission is granted to anyone to use this software for any purpose,
 * 	including commercial applications, and to alter it and redistribute it
 * 	freely, subject to the following restrictions:
 * 	  1. The origin of this software must not be misrepresented; you must not
 * 	     claim that you wrote the original software. If you use this software
 * 	     in a product, an acknowledgment in the product documentation would be
 * 	     appreciated but is not required.
 * 	  2. Altered source versions must be plainly marked as such, and must not
 * 	     be misrepresented as being the original software.
 * 	  3. This notice may not be removed or altered from any source distribution.
 */


export type Vec3Axis = 0 | 1 | 2

export default class Vec3 {
    x: number
    y: number
    z: number

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x
        this.y = y
        this.z = z
    }

    Get(axis: Vec3Axis): number {
        switch (axis) {
            case (0): return this.x
            case (1): return this.y
            case (2): return this.z
        }
    }

    Assign(v: Vec3): Vec3 {
        this.x = v.x
        this.y = v.y
        this.z = v.z
        return this
    }

    SetRow(x: number, y: number, z: number): Vec3 {
        this.x = x
        this.y = y
        this.z = z
        return this;
    }

    Set(axis: Vec3Axis | number, value: number): Vec3 {
        switch (axis) {
            case 0: this.x = value
            case 1: this.y = value
            case 2: this.z = value
        }
        return this
    }



    SetAll(v: number): Vec3 {
        return this.SetRow(v, v, v);
    }

    SetFromArray(array: [x: number, y: number, z: number]): Vec3 {
        return this.SetRow(...array);
    }

    Sub(lhs: Vec3): Vec3 {
        return new Vec3(
            this.x - lhs.x,
            this.y - lhs.y,
            this.z - lhs.z
        );
    }

    Add(lhs: Vec3): Vec3 {
        return new Vec3(
            this.x + lhs.x,
            this.y + lhs.y,
            this.z + lhs.z
        );
    }


    MultiplyByVec3(lhs: Vec3): Vec3 {
        return new Vec3(
            this.x * lhs.x,
            this.y * lhs.y,
            this.z * lhs.z
        );
    }

    MultiplyByNumber(n: number): Vec3 {
        return new Vec3(
            this.x * n,
            this.y * n,
            this.z * n
        );
    }

    DivideByNumber(n: number): Vec3 {
        return new Vec3(
            this.x / n,
            this.y / n,
            this.z / n
        );
    }
    /**
     * Inverse
     */
    Inverse = (): Vec3 => this.SetRow(-this.x, -this.y, -this.z)

    public static Sub(lhs: Vec3, rhs: Vec3): Vec3 {
        return new Vec3(
            lhs.x - rhs.x,
            lhs.y - rhs.y,
            lhs.z - rhs.z
        );
    }

    public static Add(lhs: Vec3, rhs: Vec3): Vec3 {
        return new Vec3(
            lhs.x + rhs.x,
            lhs.y + rhs.y,
            lhs.z + rhs.z
        );
    }

    public static MultiplyByVec3(lhs: Vec3, rhs: Vec3): Vec3 {
        return new Vec3(
            lhs.x * rhs.x,
            lhs.y * rhs.y,
            lhs.z * rhs.z
        );
    }

    public static MultiplyByNumber(lhs: Vec3, n: number): Vec3 {
        return new Vec3(
            lhs.x * n,
            lhs.y * n,
            lhs.z * n
        );
    }
    public static DivideByNumber(lhs: Vec3, n: number): Vec3 {
        return new Vec3(
            lhs.x / n,
            lhs.y / n,
            lhs.z / n
        );
    }

    /**
     * Reset
     */
    public static Reset(v: Vec3): Vec3 {
        return v.SetRow(0, 0, 0)
    }
    /**
     * Identity
     */
    public static get Identity(): Vec3 { return new Vec3(0, 0, 0) }

    /**
     * Mul
     */
    public static Mul = (a: Vec3, b: Vec3): Vec3 =>
        new Vec3(a.x * b.x, a.y * b.y, a.z * b.z)

    public static Dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
    public static Cross = (a: Vec3, b: Vec3): Vec3 => new Vec3(
        a.y * b.z - b.y * a.z,
        b.x * a.z - a.x * b.z,
        a.x * b.y - b.x * a.y,
    );

    /**
     * Length
     */
    public static Length(v: Vec3): number {
        return Math.sqrt(v.x * v.x + v.y * v.y + v.z + v.z)
    }

    /**
     * LengthSq
     */
    public static LengthSq(v: Vec3): number {
        return v.x * v.x + v.y * v.y + v.z + v.z
    }

    /**
     * Normalize
     */
    public static Normalize(v: Vec3): Vec3 {
        const l = Vec3.Length(v)
        if (l != 0) {
            const inv = 1 / l
            return v.MultiplyByNumber(inv)
        }
        return v
    }

    /**
     * Distance
     */
    public static Distance(a: Vec3, b: Vec3): number {
        const xp = a.x - b.x
        const yp = a.y - b.y
        const zp = a.z - b.z

        return Math.sqrt(xp * xp + yp * yp + zp * zp)
    }

    /**
     * DistanceSq
     */
    public DistanceSq(a: Vec3, b: Vec3): number {
        const xp = a.x - b.x
        const yp = a.y - b.y
        const zp = a.z - b.z

        return xp * xp + yp * yp + zp * zp
    }

    /**
     * Abs 
     */
    public static Abs = (v: Vec3): Vec3 => new Vec3(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))

    /**
     * Min
     */
    public static Min = (a: Vec3, b: Vec3): Vec3 => new Vec3(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.min(a.z, b.z))

    /**
     * Max
     */
    public static Max = (a: Vec3, b: Vec3): Vec3 => new Vec3(Math.max(a.x, b.x), Math.max(a.y, b.y), Math.max(a.z, b.z))

    /**
     * MinPerElem
     */
    public static MinPerElem = (v: Vec3): number => Math.min(v.x, Math.min(v.y, v.z))

    /**
     * MaxPerElem
     */
    public static MaxPerElem = (v: Vec3): number => Math.max(v.x, Math.max(v.y, v.z))
    /**
     * Inverse
     */
    public static Inverse = (v: Vec3): Vec3 => new Vec3(-v.x, -v.y, -v.z)
}

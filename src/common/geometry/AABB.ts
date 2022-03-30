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

import Vec3, { ReadonlyVec3 } from "@math/Vec3";

export type ReadonlyAABB = Readonly<AABB>

export default class AABB {
    min: Vec3;
    max: Vec3;

    constructor(min?: ReadonlyVec3, max?: ReadonlyVec3) {
        this.max = max ? max : new Vec3(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
        this.min = min ? min : new Vec3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    }

    // http://box2d.org/2014/02/computing-a-basis/
    static ComputeBasis(a: ReadonlyVec3, b: Vec3, c: Vec3): { b: Vec3, c: Vec3 } {
        // Suppose vector a has all equal components and is a unit vector: a = (s, s, s)
        // Then 3*s*s = 1, s = sqrt(1/3) = 0.57735027. This means that at least one component of a
        // unit vector must be greater or equal to 0.57735027. Can use SIMD select operation.

        if (Math.abs(a.x) >= (0.57735027))
            b.SetRow(a.y, -a.x, 0);
        else
            b.SetRow(0, a.z, -a.y);

        b.Normalize()
        c = Vec3.Cross(a, b);

        return { b, c }
    }

    static AABBtoAABB(a: ReadonlyAABB, b: ReadonlyAABB): boolean {
        if (a.max.x < b.min.x || a.min.x > b.max.x)
            return false;

        if (a.max.y < b.min.y || a.min.y > b.max.y)
            return false;

        if (a.max.z < b.min.z || a.min.z > b.max.z)
            return false;

        return true;
    }

    Contains(other: ReadonlyAABB): boolean {
        return (
            this.min.x <= other.min.x &&
            this.min.y <= other.min.y &&
            this.min.z <= other.min.z &&
            this.max.x >= other.max.x &&
            this.max.y >= other.max.y &&
            this.max.z >= other.max.z
        )
    }

    ContainsPoint(point: ReadonlyVec3): boolean {
        return (
            this.min.x <= point.x &&
            this.min.y <= point.y &&
            this.min.z <= point.z &&
            this.max.x >= point.x &&
            this.max.y >= point.y &&
            this.max.z >= point.z
        )
    }

    SurfaceArea(): number {
        const x = this.max.x - this.min.x;
        const y = this.max.y - this.min.y;
        const z = this.max.z - this.min.z;

        return 2 * (x * y + x * z + y * z);
    }

    static Combine = (a: ReadonlyAABB, b: ReadonlyAABB): AABB =>
    ({
        min: Vec3.Min(a.min, b.min),
        max: Vec3.Max(a.max, b.max)
    } as AABB)
}
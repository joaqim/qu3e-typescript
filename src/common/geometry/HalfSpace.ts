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

import Vec3 from "@math/Vec3";

export default class HalfSpace {
    normal: Vec3;
    distance: number;

    constructor(normal: Vec3, distance: number) {
        this.normal = normal;
        this.distance = distance;
    }

    Set(values: [a: Vec3, b: Vec3, c: Vec3] | [normal: Vec3, p: Vec3]): void {
        const a = values[0];
        const b = values[1];
        const c = values[2];

        this.normal = Vec3.Normalize(c ? Vec3.Cross(b.Sub(a), c.Sub(a)) : a);
        this.distance = Vec3.Dot(this.normal, c ? a : b);
    }

    Origin = () => this.normal.MultiplyByNumber(this.distance);
    Distance = (p: Vec3): number => Vec3.Dot(this.normal, p) - this.Distance(p);
    Projected = (p: Vec3): Vec3 => p.Sub(this.normal).MultiplyByNumber(this.Distance(p));
}

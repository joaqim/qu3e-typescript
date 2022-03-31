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

import type Box from "@collision/Box"

declare global {
  var Q3_SLEEP_LINEAR: number
  var Q3_SLEEP_ANGULAR: number
  var Q3_SLEEP_TIME: number
  var Q3_BAUMGARTE: number
  var Q3_PENETRATION_SLOP: number

  var Assert: (condition: boolean, message?: string) => void
  var MixRestitution: (A: Box, B: Box) => number
  var MixFriction: (A: Box, B: Box) => number
}

Q3_SLEEP_LINEAR = 0.01
Q3_SLEEP_ANGULAR = (2 / 180) * Math.PI
Q3_SLEEP_TIME = 0.5
Q3_BAUMGARTE = 0.2
Q3_PENETRATION_SLOP = 0.05

Assert = (condition: boolean, message?: string) => {
  if (!condition) throw new Error(message)
}
MixRestitution = (A: Box, B: Box) => Math.max(A.restitution, B.restitution)
MixFriction = (A: Box, B: Box) => Math.sqrt(A.friction * B.friction)

/*
export default class Settings {
    //--------------------------------------------------------------------------------------------------
    // Internal Implementation const doubleants (do not change unless you know what you're doing)
    //--------------------------------------------------------------------------------------------------
    static readonly Q3_SLEEP_LINEAR = 0.01;

    static readonly Q3_SLEEP_ANGULAR = (2.0 / 180.0) * Math.PI;

    static readonly Q3_SLEEP_TIME = 0.5;

    static readonly Q3_BAUMGARTE = 0.2;

    static readonly Q3_PENETRATION_SLOP = 0.05;

    public static Assert(condition: boolean, message?: string): void {
        if (!condition) throw Error(message)
    }

    // Restitution mixing. The idea is to use the maximum bounciness, so bouncy
    // objects will never not bounce during collisions.
    public static MixRestitution(A: Box, B: Box): number {
        return Math.max(A.restitution, B.restitution);
    }

    // Friction mixing. The idea is to allow a very low friction value to
    // drive down the mixing result. Example: anything slides on ice.
    public static MixFriction(A: Box, B: Box): number {
        return Math.sqrt(A.friction * B.friction);
    }
}
*/

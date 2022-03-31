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

import { Vec3 } from "@math/Vec3"

export class RaycastData {
  // TODO: Better defaults
  start!: Vec3 // Beginning point of the ray
  dir!: Vec3 // Direction of the ray (normalized)
  t!: number // Time specifying ray endpoint

  toi!: number // Solved time of impact
  normal!: Vec3 // Surface normal at impact

  // NOTE: Is this constructor used/needed
  public constructor(startPoint: Vec3, direction: Vec3, endPointTime: number) {
    this.start = startPoint
    this.dir = direction
    this.t = endPointTime
  }

  Set(startPoint: Vec3, direction: Vec3, endPointTime: number) {
    this.start = startPoint
    this.dir = direction
    this.t = endPointTime
  }

  // Uses toi, start and dir to compute the point at toi. Should
  // only be called after a raycast has been conducted with a
  // return value of true.
  GetImpactPoint(): Vec3 {
    return this.start.Add(Vec3.Scale(this.dir, this.toi))
  }
}

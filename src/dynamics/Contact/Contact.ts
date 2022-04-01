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

import type FeaturePair from "@dynamics/FeaturePair"
import type { Vec3 } from "@math"

export default class Contact {
  // TODO: Better defaults
  public position!: Vec3 // World coordinate of contact
  public penetration!: number // Depth of penetration from collision
  public normalImpulse!: number // Accumulated normal impulse
  public tangentImpulse!: number // Accumulated friction impulse
  public bitangentImpulse!: number // Accumulated friction impulse
  public bias!: number // Restitution + baumgarte
  public normalMass!: number // Normal constraint mass
  public tangentMass!: number // Tangent constraint mass
  public bitangentMass!: number // Tangent constraint mass
  public fp!: FeaturePair // Features on A and B for this contact
  public warmStarted!: number // Used for debug rendering
}

// eslint-disable-next-line no-shadow
export enum ContactFlags {
  Colliding = 0x00_00_00_01, // Set when contact collides during a step
  WasColliding = 0x00_00_00_02, // Set when two objects stop colliding
  Island = 0x00_00_00_04, // For internal marking during island forming
}

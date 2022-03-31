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
import { BodyType } from "./Body"

export class BodyDefinition {
  public constructor() {
    // Set all initial positions/velocties to zero
    this.axis = Vec3.Identity()
    this.angle = 0
    this.position = Vec3.Identity()
    this.linearVelocity = Vec3.Identity()
    this.angularVelocity = Vec3.Identity()

    // Usually a gravity scale of 1 is the best
    this.gravityScale = 1

    // Common default values
    this.bodyType = BodyType.StaticBody
    this.layers = 1
    this.userData = null
    this.allowSleep = true
    this.awake = true
    this.active = true
    this.lockAxisX = false
    this.lockAxisY = false
    this.lockAxisZ = false

    this.linearDamping = 0
    this.angularDamping = 0.1
  }

  public axis: Vec3 // Initial world transformation.
  public angle: number // Initial world transformation. Radians.
  public position: Vec3 // Initial world transformation.
  public linearVelocity: Vec3 // Initial linear velocity in world space.
  public angularVelocity: Vec3 // Initial angular velocity in world space.
  public gravityScale: number // Convenient scale values for gravity x, y and z directions.
  public layers: number // Bitmask of collision layers. Bodies matching at least one layer can collide.
  public userData: unknown // Use to store application specific data.

  public linearDamping: number
  public angularDamping: number

  // Static, dynamic or kinematic. Dynamic bodies with zero mass are defaulted
  // to a mass of 1. Static bodies never move or integrate, and are very CPU
  // efficient. Static bodies have infinite mass. Kinematic bodies have
  // infinite mass, but *do* integrate and move around. Kinematic bodies do not
  // resolve any collisions.
  public bodyType: BodyType

  public allowSleep: boolean // Sleeping lets a body assume a non-moving state. Greatly reduces CPU usage.
  public awake: boolean // Initial sleep state. True means awake.
  public active: boolean // A body can start out inactive and just sits in memory.
  public lockAxisX: boolean // Locked rotation on the x axis.
  public lockAxisY: boolean // Locked rotation on the y axis.
  public lockAxisZ: boolean // Locked rotation on the z axis.
}

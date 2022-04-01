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

import "@common/global"
import { Mat3 } from "./Mat3"
import { Vec3 } from "./Vec3"

export class Quaternion {
  public x!: number
  public y!: number
  public z!: number
  public w!: number

  public constructor(
    payload:
      | [x: number, y: number, z: number, w: number]
      | [axis: Vec3, radians: number],
  ) {
    if (payload.length === 4) {
      this.SetRow(...payload)
    } else {
      this.Set(...payload)
    }
  }

  public SetRow(x: number, y: number, z: number, w: number): void {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  public Set(axis: Vec3, radians: number): void {
    const halfAngle = radians * 0.5
    const s = Math.sin(halfAngle)
    this.x = s * axis.x
    this.y = s * axis.y
    this.z = s * axis.z
    this.w = Math.cos(halfAngle)
  }

  public Assign(q: Quaternion): void {
    this.x = q.x
    this.y = q.y
    this.z = q.z
    this.w = q.w
  }

  public ToAxisAngle(axis: Vec3, angle: number): { axis: Vec3; angle: number } {
    Assert(this.w <= 1)
    angle = 2 * Math.acos(this.w)

    let l = Math.sqrt(1 - this.w * this.w)

    if (l === 0) {
      axis = new Vec3(0, 0, 0)
    } else {
      l = 1 / l
      axis = new Vec3(this.x * l, this.y * l, this.z * l)
    }

    return { axis, angle }
  }

  public Integrate(dv: Vec3, dt: number): void {
    const q = new Quaternion([dv.x * dt, dv.y * dt, dv.z * dt, 0])

    q.Multiply(this)

    this.x += q.x * 0.5
    this.y += q.y * 0.5
    this.z += q.z * 0.5
    this.w += q.w * 0.5

    this.Assign(Quaternion.Normalize(this))
  }

  /**
   * Multiply
   */
  public Multiply(rhs: Readonly<Quaternion>): Quaternion {
    this.SetRow(
      this.w * rhs.x + this.x * rhs.w + this.y * rhs.z - this.z * rhs.y,
      this.w * rhs.y + this.y * rhs.w + this.z * rhs.x - this.x * rhs.z,
      this.w * rhs.z + this.z * rhs.w + this.x * rhs.y - this.y * rhs.x,
      this.w * rhs.w - this.x * rhs.x - this.y * rhs.y - this.z * rhs.z,
    )
    return this
  }

  /**
   * Multiply
   */
  public static Multiply(
    lhs: Readonly<Quaternion>,
    rhs: Readonly<Quaternion>,
  ): Quaternion {
    return new Quaternion([
      lhs.w * rhs.x + lhs.x * rhs.w + lhs.y * rhs.z - lhs.z * rhs.y,
      lhs.w * rhs.y + lhs.y * rhs.w + lhs.z * rhs.x - lhs.x * rhs.z,
      lhs.w * rhs.z + lhs.z * rhs.w + lhs.x * rhs.y - lhs.y * rhs.x,
      lhs.w * rhs.w - lhs.x * rhs.x - lhs.y * rhs.y - lhs.z * rhs.z,
    ])
  }

  /**
   * ToMat3
   */
  public ToMat3(): Mat3 {
    const qx2 = this.x + this.x
    const qy2 = this.y + this.y
    const qz2 = this.z + this.z
    const qxqx2 = this.x * qx2
    const qxqy2 = this.x * qy2
    const qxqz2 = this.x * qz2
    const qxqw2 = this.w * qx2
    const qyqy2 = this.y * qy2
    const qyqz2 = this.y * qz2
    const qyqw2 = this.w * qy2
    const qzqz2 = this.z * qz2
    const qzqw2 = this.w * qz2

    return new Mat3([
      new Vec3(1 - qyqy2 - qzqz2, qxqy2 + qzqw2, qxqz2 - qyqw2),
      new Vec3(qxqy2 - qzqw2, 1 - qxqx2 - qzqz2, qyqz2 + qxqw2),
      new Vec3(qxqz2 + qyqw2, qyqz2 - qxqw2, 1 - qxqx2 - qyqy2),
    ])
  }

  /**
   * Normalize
   */
  public static Normalize(q: Quaternion): Quaternion {
    let x = q.x
    let y = q.y
    let z = q.z
    let w = q.w

    let d = q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z

    if (d === 0) w = 1

    d = 1 / Math.sqrt(d)

    if (d > 1e-8) {
      x *= d
      y *= d
      z *= d
      w *= d
    }

    return new Quaternion([x, y, z, w])
  }
}

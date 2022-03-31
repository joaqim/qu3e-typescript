/* eslint-disable max-classes-per-file */
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

import { RaycastData, AABB } from "@common"
import { Render } from "@common/Render"
import { FixedArray } from "@containers"
import  Body  from "@dynamics/Body"
import { Vec3, Mat3, ReadonlyVec3, ReadonlyMat3, Vec3Axis, Transform } from "@math"

export class MassData {
  // TODO: Better defaults
  public center!: Vec3
  public inertia!: Mat3
  public mass!: number

  public constructor(
    center: ReadonlyVec3,
    inertia: ReadonlyMat3,
    mass: number,
  ) {
    this.center = center
    this.inertia = inertia
    this.mass = mass
  }
}

export default class Box {
  public local!: Transform
  public extent!: Vec3 // extent, as in the extent of each OBB axis

  public body!: Body
  public friction!: number
  public restitution!: number
  public density!: number

  public broadPhaseIndex!: number
  public userData: unknown
  public sensor!: boolean

  public constructor(
    local: Transform,
    extent: Vec3,
    body: Body,
    friction: number,
    restitution: number,
    density: number,
    sensor: boolean,
  ) {
    this.local = local
    this.extent = extent
    this.body = body
    this.friction = friction
    this.restitution = restitution
    this.density = density
    this.sensor = sensor
  }

  public TestPoint(tx: Transform, p: Vec3): boolean {
    const world = Transform.Mul(tx, this.local)
    const p0 = Transform.MulTWithVec3(world, p)

    // NOTE: replaced ++index with index +=1
    for (let index = 0; index < 3; index += 1) {
      const d = p0.Get(index as Vec3Axis)
      const ei = this.extent.Get(index as Vec3Axis)

      if (d > ei || d < -ei) {
        return false
      }
    }
    return true
  }

  public Raycast(tx: Transform, raycast: RaycastData): boolean {
    const world = Transform.Mul(tx, this.local)
    const d = Transform.MulTMat3WithVec3(world.rotation, raycast.dir)
    const p = Transform.MulTWithVec3(world, raycast.start)
    const epsilon = 1e-8
    let tmin = 0
    let tmax = raycast.t

    // t = (e[ i ] - p.[ i ]) / d[ i ]
    let t0
    let t1
    let n0 = new Vec3()

    // NOTE: Replaced ++index with index += 1
    for (let index = 0; index < 3; index += 1) {
      // Check for ray parallel to and outside of AABB
      if (Math.abs(d.Get(index as Vec3Axis)) < epsilon) {
        // Detect separating axes
        if (
          p.Get(index as Vec3Axis) < -this.extent.Get(index as Vec3Axis) ||
          p.Get(index as Vec3Axis) > this.extent.Get(index as Vec3Axis)
        ) {
          return false
        }
      } else {
        const d0 = 1 / d.Get(index as Vec3Axis)
        const s = Math.sign(d.Get(index as Vec3Axis))
        const ei = this.extent.Get(index as Vec3Axis) * s
        const n = new Vec3(0, 0, 0)
        n.Set(index, -s)

        t0 = -(ei + p.Get(index as Vec3Axis)) * d0
        t1 = (ei - p.Get(index as Vec3Axis)) * d0

        if (t0 > tmin) {
          n0 = n
          tmin = t0
        }

        tmax = Math.min(tmax, t1)

        if (tmin > tmax) {
          return false
        }
      }
    }

    raycast.normal = Transform.MulMat3WithVec3(world.rotation, n0)
    raycast.toi = tmin

    return true
  }

  private static readonly kBoxVertices: FixedArray<8, Vec3> = [
    new Vec3(-1, -1, -1),
    new Vec3(-1, -1, 1),
    new Vec3(-1, 1, -1),
    new Vec3(-1, 1, 1),
    new Vec3(1, -1, -1),
    new Vec3(1, -1, 1),
    new Vec3(1, 1, -1),
    new Vec3(1, 1, 1),
  ]

  public ComputeAABB(tx: Transform, aabb?: AABB): AABB {
    const world = Transform.Mul(tx, this.local)
    let min = new Vec3(
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
      Number.MAX_SAFE_INTEGER,
    )
    let max = new Vec3(
      Number.MIN_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    )

    // NOTE: Is this indexing correct?
    // Replaced ++index here with index += 1
    for (let index = 0; index < 8; index += 1) {
      const v = Transform.MulWithVec3(
        world,
        Vec3.Mul(Box.kBoxVertices[index], this.extent),
      )
      min = Vec3.Min(min, v)
      max = Vec3.Max(max, v)
    }

    if (!aabb) {
      return new AABB(min, max)
    }
    aabb.min = min
    aabb.max = max
    return aabb
  }

  public ComputeMass(md?: MassData): MassData {
    // Calculate inertia tensor
    const ex2 = 4 * this.extent.x * this.extent.x
    const ey2 = 4 * this.extent.y * this.extent.y
    const ez2 = 4 * this.extent.z * this.extent.z
    const mass =
      8 * this.extent.x * this.extent.y * this.extent.z * this.density
    const x = (1 / 12) * mass * (ey2 + ez2)
    const y = (1 / 12) * mass * (ex2 + ez2)
    const z = (1 / 12) * mass * (ex2 + ey2)
    let I = Mat3.Diagonal(x, y, z)

    // Transform tensor to local space
    I = this.local.rotation
      .Multiply(I)
      .Multiply(Mat3.Transpose(this.local.rotation))
    I.Add(
      Mat3.Identity()
        .MultiplyByNumber(Vec3.Dot(this.local.position, this.local.position))
        .Sub(Mat3.OuterProduct(this.local.position, this.local.position)),
    ).MultiplyByNumber(mass)

    if (!md) return new MassData(this.local.position, I, mass)
    md.center = this.local.position
    md.inertia = I
    md.mass = mass
    return md
  }

  //--------------------------------------------------------------------------------------------------

  /* eslint-disable prettier/prettier */
  private static readonly kBoxIndices: FixedArray<36> = [
    1 - 1, 7 - 1, 5 - 1,
    1 - 1, 3 - 1, 7 - 1,
    1 - 1, 4 - 1, 3 - 1,
    1 - 1, 2 - 1, 4 - 1,
    3 - 1, 8 - 1, 7 - 1,
    3 - 1, 4 - 1, 8 - 1,
    5 - 1, 7 - 1, 8 - 1,
    5 - 1, 8 - 1, 6 - 1,
    1 - 1, 5 - 1, 6 - 1,
    1 - 1, 6 - 1, 2 - 1,
    2 - 1, 6 - 1, 8 - 1,
    2 - 1, 8 - 1, 4 - 1,
  ];
  /* eslint-enable prettier/prettier */

  public Render(tx: Transform, _awake: boolean, render: Render): void {
    const world = Transform.Mul(tx, this.local)

    const vertices: FixedArray<8, Vec3> = [
      new Vec3(-this.extent.x, -this.extent.y, -this.extent.z),
      new Vec3(-this.extent.x, -this.extent.y, this.extent.z),
      new Vec3(-this.extent.x, this.extent.y, -this.extent.z),
      new Vec3(-this.extent.x, this.extent.y, this.extent.z),
      new Vec3(this.extent.x, -this.extent.y, -this.extent.z),
      new Vec3(this.extent.x, -this.extent.y, this.extent.z),
      new Vec3(this.extent.x, this.extent.y, -this.extent.z),
      new Vec3(this.extent.x, this.extent.y, this.extent.z),
    ]

    for (let index = 0; index < 36; index += 3) {
      const a = Transform.MulWithVec3(world, vertices[Box.kBoxIndices[index]])
      const b = Transform.MulWithVec3(
        world,
        vertices[Box.kBoxIndices[index + 1]],
      )
      const c = Transform.MulWithVec3(
        world,
        vertices[Box.kBoxIndices[index + 2]],
      )

      const n = Vec3.Normalize(Vec3.Cross(b.Sub(a), c.Sub(a)))

      // render->SetPenColor( 0.2f, 0.4f, 0.7f, 0.5f );
      // render->SetPenPosition( a.x, a.y, a.z );
      // render->Line( b.x, b.y, b.z );
      // render->Line( c.x, c.y, c.z );
      // render->Line( a.x, a.y, a.z );

      render.SetTriNormal(n.x, n.y, n.z)
      render.Triangle(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
    }
  }
}

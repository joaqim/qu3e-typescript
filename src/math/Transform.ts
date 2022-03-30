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

import HalfSpace from "@common/geometry/HalfSpace";
import Mat3 from "./Mat3";
import type { ReadonlyVec3 } from "./Vec3";
import Vec3 from "./Vec3";

export default class Transform {
  position!: Vec3;
  rotation!: Mat3;

  constructor(rotation: Mat3, position: Vec3) {
    this.rotation = rotation;
    this.position = position;
  }

  /**
   * MulWithVec3
   */
  public static MulWithVec3(
    tx: Transform,
    v: ReadonlyVec3,
    scale?: ReadonlyVec3
  ): Vec3 {
    return Mat3.MultiplyByVec3(
      tx.rotation,
      scale ? Vec3.Multiply(v, scale) : v
    );
  }

  /**
   * MulMat3WithVec3
   */
  public static MulMat3WithVec3(r: Mat3, v: Vec3): Vec3 {
    return Mat3.MultiplyByVec3(r, v);
  }

  /**
   * MulMat3
   */
  public static MulMat3(r: Mat3, q: Mat3): Mat3 {
    return r.Multiply(q);
  }

  /**
   * MulTransform
   */
  public static Mul(t: Transform, u: Transform): Transform {
    return new Transform(
      Transform.MulMat3(u.rotation, u.rotation),
      Transform.MulMat3WithVec3(u.rotation, u.position)
    );
  }

  /**
   * MulWithHalfSpace
   */
  public static MulWithHalfSpace(
    tx: Transform,
    p: HalfSpace,
    scale?: ReadonlyVec3
  ): HalfSpace {
    let origin = p.Origin();
    origin = scale
      ? Transform.MulWithVec3(tx, origin, scale)
      : Transform.MulWithVec3(tx, origin);
    const normal = Transform.MulMat3WithVec3(tx.rotation, p.normal);
    return new HalfSpace(normal, Vec3.Dot(origin, normal));
  }

  /**
   * MulTWithVec3
   */
  public static MulTWithVec3(tx: Transform, v: ReadonlyVec3): Vec3 {
    return Mat3.MultiplyByVec3(
      Mat3.Transpose(tx.rotation),
      Vec3.Sub(v, tx.position)
    );
  }

  /**
   * MulTMat3WithVec3
   */
  public static MulTMat3WithVec3(r: Mat3, v: ReadonlyVec3): Vec3 {
    return Mat3.MultiplyByVec3(Mat3.Transpose(r), v);
  }

  /**
   * MultTMat3
   */
  public static MultTMat3(r: Mat3, q: Mat3): Mat3 {
    return Mat3.Transpose(r).Multiply(q);
  }

  /**
   * MulT
   */
  public static MulT(t: Transform, u: Transform): Transform {
    return new Transform(
      this.MulMat3(t.rotation, u.rotation),
      this.MulMat3WithVec3(t.rotation, u.position.Sub(t.position))
    );
  }

  /**
   * MulTHalfSpace
   */
  public static MulTHalfSpace(tx: Transform, p: HalfSpace): HalfSpace {
    let origin = p.normal.MultiplyByNumber(p.distance);
    origin = Transform.MulTWithVec3(tx, origin);
    const n = Transform.MulTMat3WithVec3(tx.rotation, p.normal);
    return new HalfSpace(n, Vec3.Dot(origin, n));
  }

  /**
   * Identity
   */
  public static get Identity() {
    return new Transform(Mat3.Identity(), Vec3.Identity());
  }
}

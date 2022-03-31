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

import type { FixedArray } from "@containers"
import type { Manifold } from "@dynamics/Contact"
import { FeaturePair } from "@dynamics/Contact"
import { Mat3, Transform, Vec3 } from "@math"
import type { Vec3Axis } from "@math/Vec3"
import type Box from "../Box/Box"
import { ClipVertex } from "./ClipVertex"

interface TrackResult {
  axis: number
  axisNormal: Vec3
  sMax: number
  success: boolean
}

export default abstract class Collide {
  public static input: ClipVertex[] = Array.from({ length: 8 })
  public static result: ClipVertex[] = Array.from({ length: 8 })

  public static TrackFaceAxis(
    axis: number,
    n: number,
    s: number,
    sMax: number,
    normal: Vec3,
    axisNormal: Vec3,
  ): TrackResult {
    let result = false

    if (s > 0) {
      result = true
    } else if (s > sMax) {
      sMax = s
      axis = n
      axisNormal = normal
    }

    return {
      axis,
      axisNormal,
      sMax,
      success: result,
    }
  }

  public static TrackEdgeAxis(
    axis: number,
    n: number,
    s: number,
    sMax: number,
    normal: Vec3,
    axisNormal: Vec3,
  ): TrackResult {
    let result = false

    if (s > 0) {
      result = true
    } else {
      const l = 1 / Vec3.Length(normal)
      s *= l

      if (s > sMax) {
        sMax = s
        axis = n
        // TODO: Find existing  vec multiply by number util function
        axisNormal.x = normal.x * l
        axisNormal.y = normal.y * l
        axisNormal.z = normal.z * l
      }
    }

    return {
      axis,
      axisNormal,
      sMax,
      success: result,
    }
  }

  public static ComputeReferenceEdgesAndBasis(
    extentR: Vec3,
    rtx: Transform,
    n: Vec3,
    axis: number,
    result: FixedArray<4>,
  ): { basis: Mat3; extent: Vec3; result: FixedArray<4> } {
    const basis: Mat3 = new Mat3([0, 0, 0, 0, 0, 0, 0, 0, 0])
    const extent: Vec3 = new Vec3(0, 0, 0)

    n = Transform.MulTMat3WithVec3(rtx.rotation, n)

    if (axis >= 3) axis -= 3

    switch (axis) {
      case 0:
        if (n.x > 0) {
          result[0] = 1
          result[1] = 8
          result[2] = 7
          result[3] = 9

          extent.SetRow(extentR.y, extentR.z, extentR.x)

          basis.SetRows(rtx.rotation.ey, rtx.rotation.ez, rtx.rotation.ex)
        } else {
          result[0] = 11
          result[1] = 3
          result[2] = 10
          result[3] = 5

          extent.SetRow(extentR.z, extentR.y, extentR.x)
          basis.SetRows(
            rtx.rotation.ez,
            rtx.rotation.ey,
            rtx.rotation.ex.Inverse(),
          )
        }
        break
      case 1:
        if (n.y > 0) {
          result[0] = 0
          result[1] = 1
          result[2] = 2
          result[3] = 3
          extent.SetRow(extentR.z, extentR.x, extentR.y)
          basis.SetRows(rtx.rotation.ez, rtx.rotation.ex, rtx.rotation.ey)
        } else {
          result[0] = 4
          result[1] = 5
          result[2] = 6
          result[3] = 7

          extent.SetRow(extentR.z, extentR.x, extentR.y)
          basis.SetRows(
            rtx.rotation.ez,
            rtx.rotation.ex.Inverse(),
            rtx.rotation.ey.Inverse(),
          )
        }
        break
      case 2:
        if (n.z > 0) {
          result[0] = 11
          result[1] = 4
          result[2] = 8
          result[3] = 0

          extent.SetRow(extentR.y, extentR.x, extentR.z)
          basis.SetRows(
            rtx.rotation.ey.Inverse(),
            rtx.rotation.ex,
            rtx.rotation.ez,
          )
        } else {
          result[0] = 6
          result[1] = 10
          result[2] = 2
          result[3] = 9

          extent.SetRow(extentR.y, extentR.x, extentR.z)
          basis.SetRows(
            rtx.rotation.ey.Inverse(),
            rtx.rotation.ex.Inverse(),
            rtx.rotation.ez.Inverse(),
          )
        }
        break
      default:
        break
    }
    return {
      basis,
      extent,
      result,
    }
  }

  public static ComputeIncidentFace(
    itx: Transform,
    extent: Vec3,
    n: Vec3,
    result: ClipVertex[],
  ): ClipVertex[] {
    n = Transform.MulTMat3WithVec3(itx.rotation, n).Inverse()

    const absN = Vec3.Abs(n)

    if (absN.x > absN.y && absN.x > absN.z) {
      if (n.x > 0) {
        result[0].v.SetRow(extent.x, extent.y, -extent.z)
        result[1].v.SetRow(extent.x, extent.y, -extent.z)
        result[2].v.SetRow(extent.x, -extent.y, extent.z)
        result[3].v.SetRow(extent.x, -extent.y, -extent.z)

        result[0].f.inI = 9
        result[0].f.outI = 1
        result[1].f.inI = 1
        result[1].f.outI = 8
        result[2].f.inI = 8
        result[2].f.outI = 7
        result[3].f.inI = 7
        result[3].f.outI = 9
      } else {
        result[0].v.SetRow(-extent.x, -extent.y, extent.z)
        result[1].v.SetRow(-extent.x, extent.y, extent.z)
        result[2].v.SetRow(-extent.x, extent.y, -extent.z)
        result[3].v.SetRow(-extent.x, -extent.y, -extent.z)

        result[0].f.inI = 5
        result[0].f.outI = 11
        result[1].f.inI = 11
        result[1].f.outI = 3
        result[2].f.inI = 3
        result[2].f.outI = 10
        result[3].f.inI = 10
        result[3].f.outI = 5
      }
    } else if (absN.y > absN.x && absN.y > absN.z) {
      if (n.y > 0) {
        result[0].v.SetRow(-extent.x, extent.y, extent.z)
        result[1].v.SetRow(extent.x, extent.y, extent.z)
        result[2].v.SetRow(extent.x, extent.y, -extent.z)
        result[3].v.SetRow(-extent.x, extent.y, -extent.z)

        result[0].f.inI = 3
        result[0].f.outI = 0
        result[1].f.inI = 0
        result[1].f.outI = 1
        result[2].f.inI = 1
        result[2].f.outI = 2
        result[3].f.inI = 2
        result[3].f.outI = 3
      } else {
        result[0].v.SetRow(extent.x, -extent.y, extent.z)
        result[1].v.SetRow(-extent.x, -extent.y, extent.z)
        result[2].v.SetRow(-extent.x, -extent.y, -extent.z)
        result[3].v.SetRow(extent.x, -extent.y, -extent.z)

        result[0].f.inI = 7
        result[0].f.outI = 4
        result[1].f.inI = 4
        result[1].f.outI = 5
        result[2].f.inI = 5
        result[2].f.outI = 6
        result[3].f.inI = 5
        result[3].f.outI = 6
      }
    } else if (n.z > 0) {
      result[0].v.SetRow(-extent.x, extent.y, extent.z)
      result[1].v.SetRow(-extent.x, -extent.y, extent.z)
      result[2].v.SetRow(extent.x, -extent.y, extent.z)
      result[3].v.SetRow(extent.x, extent.y, extent.z)

      result[0].f.inI = 0
      result[0].f.outI = 11
      result[1].f.inI = 11
      result[1].f.outI = 4
      result[2].f.inI = 4
      result[2].f.outI = 8
      result[3].f.inI = 8
      result[3].f.outI = 0
    } else {
      result[0].v.SetRow(extent.x, -extent.y, -extent.z)
      result[1].v.SetRow(-extent.x, -extent.y, -extent.z)
      result[2].v.SetRow(-extent.x, extent.y, -extent.z)
      result[3].v.SetRow(extent.x, extent.y, -extent.z)

      result[0].f.inI = 9
      result[0].f.outI = 6
      result[1].f.inI = 6
      result[1].f.outI = 10
      result[2].f.inI = 10
      result[2].f.outI = 2
      result[3].f.inI = 2
      result[3].f.outI = 9
    }

    // NOTE: changed ++index to index+=1
    for (let index = 0; index < 4; index += 1) {
      result[index].v = Transform.MulTWithVec3(itx, result[index].v)
    }
    return result
  }

  public static InFront = (a: number): boolean => a < 0
  public static Behind = (a: number): boolean => a > 0
  public static On = (a: number): boolean => a < 0.005 && a > -0.005
  public static Sign = (v: number): number => (v >= 0 ? 1 : -1)

  public static Orthographic(
    sign: number,
    extent: number,
    axis: Vec3Axis,
    clipEdge: number,
    input: ClipVertex[],
    inCount: number,
    result: ClipVertex[],
  ): number {
    let resultCount = 0
    let a: ClipVertex = input[inCount - 1]

    for (let index = 0; index < inCount; index += 1) {
      const b: ClipVertex = input[index]

      const da = sign * a.v.Get(axis) - extent
      const database = sign * b.v.Get(axis) - extent

      const cv = new ClipVertex()

      // B
      if (
        (this.InFront(da) && this.InFront(database)) ||
        this.On(da) ||
        this.On(database)
      ) {
        Assert(resultCount < 8)
        resultCount += 1
        result[resultCount] = b
      }

      // I
      else if (this.InFront(da) && this.Behind(database)) {
        cv.f = b.f

        // cv.v = a.v + (b.v - a.v) * (da / (da - db));
        cv.v = b.v
          .Sub(a.v)
          .MultiplyByNumber(da / (da - database))
          .Add(a.v)

        cv.f.outR = clipEdge
        cv.f.outI = 0

        Assert(resultCount < 8)
        resultCount += 1
        result[resultCount] = cv
      }

      // I, B
      else if (this.Behind(da) && this.InFront(database)) {
        cv.f = a.f

        // cv.v = a.v + (b.v - a.v) * (da / (da - db));
        cv.v = b.v
          .Sub(a.v)
          .MultiplyByNumber(da / (da - database))
          .Add(a.v)

        cv.f.inR = clipEdge
        cv.f.inI = 0

        Assert(resultCount < 8)
        resultCount += 1
        result[resultCount] = cv

        Assert(resultCount < 8)
        resultCount += 1
        result[resultCount] = b
      }

      a = b
    }

    return resultCount
  }

  public static Clip(
    rPos: Vec3,
    extent: Vec3,
    clipEdges: number[],
    basis: Mat3,
    incident: ClipVertex[],
    resultVerts: ClipVertex[],
    resultDepths: number[],
  ): number {
    let inCount = 4
    let resultCount

    for (let index = 0; index < 4; index += 1) {
      this.input[index].v = Transform.MulTMat3WithVec3(
        basis,
        incident[index].v.Sub(rPos),
      )
    }

    resultCount = Collide.Orthographic(
      1,
      extent.x,
      0,
      clipEdges[0],
      this.input,
      inCount,
      this.result,
    )

    if (resultCount === 0) return 0

    inCount = Collide.Orthographic(
      1,
      extent.y,
      1,
      clipEdges[1],
      this.result,
      resultCount,
      this.input,
    )

    if (inCount === 0) return 0

    resultCount = Collide.Orthographic(
      -1,
      extent.x,
      0,
      clipEdges[2],
      this.input,
      inCount,
      this.result,
    )

    if (resultCount === 0) return 0

    inCount = Collide.Orthographic(
      -1,
      extent.y,
      1,
      clipEdges[3],
      this.result,
      resultCount,
      this.input,
    )

    // Keep incident vertices behind the reference face
    resultCount = 0

    for (let index = 0; index < inCount; index += 1) {
      const d = this.input[index].v.z - extent.z

      if (d <= 0) {
        resultVerts[resultCount].v = Transform.MulMat3WithVec3(
          basis,
          this.input[index].v,
        ).Add(rPos)
        resultVerts[resultCount].f = this.input[index].f
        resultCount += 1
        resultDepths[resultCount] = d
      }
    }

    // Assert(resultCount <= 8);

    return resultCount
  }

  //--------------------------------------------------------------------------------------------------
  public static EdgesContact(
    PA: Vec3,
    QA: Vec3,
    PB: Vec3,
    QB: Vec3,
  ): { CA: Vec3; CB: Vec3 } {
    const DA = Vec3.Sub(QA, PA)
    const DB = Vec3.Sub(QB, PB)
    const r = Vec3.Sub(PA, PB)

    const a = Vec3.Dot(DA, DA)
    // eslint-disable-next-line unicorn/prevent-abbreviations
    const e = Vec3.Dot(DB, DB)
    const f = Vec3.Dot(DB, r)
    const c = Vec3.Dot(DA, r)

    const b = Vec3.Dot(DA, DB)
    const denom = a * e - b * b

    const TA = (b * f - c * e) / denom
    const TB = (b * TA + f) / e

    const CA = Vec3.Add(PA, DA.MultiplyByNumber(TA))
    const CB = Vec3.Add(PA, DB.MultiplyByNumber(TB))

    return { CA, CB }
  }

  //--------------------------------------------------------------------------------------------------
  public static SupportEdge(
    tx: Transform,
    extent: Vec3,
    n: Vec3,
  ): { a: Vec3; b: Vec3 } {
    n = Transform.MulTMat3WithVec3(tx.rotation, n)
    const absN = Vec3.Abs(n)
    const a = new Vec3()
    const b = new Vec3()

    // x > y
    if (absN.x > absN.y) {
      // x > y > z
      if (absN.y > absN.z) {
        a.SetRow(extent.x, extent.y, extent.z)
        b.SetRow(extent.x, extent.y, -extent.z)
      }

      // x > z > y || z > x > y
      else {
        a.SetRow(extent.x, extent.y, extent.z)
        b.SetRow(extent.x, -extent.y, extent.z)
      }
    } // y > x > z
    else if (absN.x > absN.z) {
      a.SetRow(extent.x, extent.y, extent.z)
      b.SetRow(extent.x, extent.y, -extent.z)
    } // z > y > x || y > z > x
    else {
      a.SetRow(extent.x, extent.y, extent.z)
      b.SetRow(-extent.x, extent.y, extent.z)
    }

    const signx = this.Sign(n.x)
    const signy = this.Sign(n.y)
    const signz = this.Sign(n.z)

    a.x *= signx
    a.y *= signy
    a.z *= signz
    b.x *= signx
    b.y *= signy
    b.z *= signz

    return {
      a: Transform.MulWithVec3(tx, a),
      b: Transform.MulWithVec3(tx, b),
    }
  }

  //--------------------------------------------------------------------------------------------------
  // Caches for BoxtoBox
  public static incident: FixedArray<4, ClipVertex>
  public static clipEdges: FixedArray<4>
  public static results: ClipVertex[] = Array.from({ length: 8 })
  public static depths: number[] = Array.from({ length: 8 })

  // Resources:
  // http://www.randygaul.net/2014/05/22/deriving-obb-to-obb-intersection-sat/
  // https://box2d.googlecode.com/files/GDC2007_ErinCatto.zip
  // https://box2d.googlecode.com/files/Box2D_Lite.zip
  public static BoxtoBox(m: Manifold, a: Box, b: Box): void {
    let atx = a.body.GetTransform()
    let btx = b.body.GetTransform()
    const aL = a.local
    const bL = b.local
    atx = Transform.Mul(atx, aL)
    btx = Transform.Mul(btx, bL)

    const extentA = a.extent
    const extentB = b.extent

    // B's frame input A's space
    const C = Mat3.Transpose(atx.rotation).Multiply(btx.rotation)

    const absC = new Mat3()
    let parallel = false
    const kCosTol = 1e-6

    for (let indexAxis1 = 0; indexAxis1 < 3; indexAxis1 += 1) {
      for (let indexAxis2 = 0; indexAxis2 < 3; indexAxis2 += 1) {
        const value = Math.abs(C.GetByAxis(indexAxis1, indexAxis2))

        const o = absC.GetAxis(indexAxis1)

        o.Set(indexAxis2, value)

        absC.SetRow(indexAxis1, o)

        if (value + kCosTol >= 1) parallel = true
      }
    }

    // Vector from center A to center B input A's space
    const t = Transform.MulTMat3WithVec3(
      atx.rotation,
      Vec3.Sub(btx.position, atx.position),
    )

    // Query states
    let s
    let aMax = -Number.MAX_SAFE_INTEGER
    let bMax = -Number.MAX_SAFE_INTEGER
    let eMax = -Number.MAX_SAFE_INTEGER

    // TODO: Are these still valid in Typescript? ( from C# )
    /*
    let aAxis = ~0
    let bAxis = ~0
    let eAxis = ~0
    */
    let aAxis = 0
    let bAxis = 0
    let eAxis = 0

    let nA = new Vec3()
    let nB = new Vec3()
    let nE = new Vec3()

    // Face axis checks

    // a's x axis
    s = Math.abs(t.x) - (extentA.x + Vec3.Dot(absC.ex, extentB))
    let trackFaceResult = this.TrackFaceAxis(
      aAxis,
      0,
      s,
      aMax,
      atx.rotation.ex,
      nA,
    )

    if (trackFaceResult.success) return
    ({ axis: aAxis, sMax: aMax, axisNormal: nA } = trackFaceResult)

    // a's y axis
    s = Math.abs(t.y) - (extentA.y + Vec3.Dot(absC.ey, extentB))
    trackFaceResult = this.TrackFaceAxis(aAxis, 1, s, aMax, atx.rotation.ey, nA)

    if (trackFaceResult.success) return
    ({ axis: aAxis, sMax: aMax, axisNormal: nA } = trackFaceResult)

    // a's z axis
    s = Math.abs(t.z) - (extentA.z + Vec3.Dot(absC.ez, extentB))
    trackFaceResult = this.TrackFaceAxis(aAxis, 2, s, aMax, atx.rotation.ez, nA)

    if (trackFaceResult.success) return
    ({ axis: aAxis, sMax: aMax, axisNormal: nA } = trackFaceResult)

    // b's x axis
    s = Math.abs(Vec3.Dot(t, C.ex)) - (extentB.x + Vec3.Dot(absC.ex, extentA))
    trackFaceResult = this.TrackFaceAxis(bAxis, 3, s, bMax, btx.rotation.ex, nB)

    if (trackFaceResult.success) return
    ({ axis: bAxis, sMax: bMax, axisNormal: nB } = trackFaceResult)

    // b's y axis
    s = Math.abs(Vec3.Dot(t, C.ey)) - (extentB.y + Vec3.Dot(absC.ey, extentA))
    trackFaceResult = this.TrackFaceAxis(bAxis, 4, s, bMax, btx.rotation.ey, nB)

    if (trackFaceResult.success) return
    ({ axis: bAxis, sMax: bMax, axisNormal: nB } = trackFaceResult)

    // b's z axis
    s = Math.abs(Vec3.Dot(t, C.ez)) - (extentB.z + Vec3.Dot(absC.ez, extentA))
    trackFaceResult = this.TrackFaceAxis(bAxis, 5, s, bMax, btx.rotation.ez, nB)

    if (trackFaceResult.success) return
    ({ axis: bAxis, sMax: bMax, axisNormal: nB } = trackFaceResult)

    if (!parallel) {
      // Edge axis checks

      // Cross( a.x, b.x )
      let rA =
        extentA.y * absC.GetByAxis(0, 2) + extentA.z * absC.GetByAxis(0, 1)
      let rB =
        extentB.y * absC.GetByAxis(2, 0) + extentB.z * absC.GetByAxis(1, 0)

      s =
        Math.abs(t.z * C.GetByAxis(0, 1) - t.y * C.GetByAxis(0, 2)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        6,
        s,
        eMax,
        new Vec3(0, -C.GetByAxis(0, 2), C.GetByAxis(0, 1)),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.x, b.y )
      rA = extentA.y * absC.GetByAxis(1, 2) + extentA.z * absC.GetByAxis(1, 1)
      rB = extentB.x * absC.GetByAxis(2, 0) + extentB.z * absC.GetByAxis(0, 0)
      s =
        Math.abs(t.z * C.GetByAxis(1, 1) - t.y * C.GetByAxis(1, 2)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        7,
        s,
        eMax,
        new Vec3(0, -C.GetByAxis(1, 2), C.GetByAxis(1, 1)),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.x, b.z )
      rA = extentA.y * absC.GetByAxis(2, 2) + extentA.z * absC.GetByAxis(2, 1)
      rB = extentB.x * absC.GetByAxis(1, 0) + extentB.y * absC.GetByAxis(0, 0)
      s =
        Math.abs(t.z * C.GetByAxis(2, 1) - t.y * C.GetByAxis(2, 2)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        8,
        s,
        eMax,
        new Vec3(0, -C.GetByAxis(2, 2), C.GetByAxis(2, 1)),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.y, b.x )
      rA = extentA.x * absC.GetByAxis(0, 2) + extentA.z * absC.GetByAxis(0, 0)
      rB = extentB.y * absC.GetByAxis(2, 1) + extentB.z * absC.GetByAxis(1, 1)
      s =
        Math.abs(t.x * C.GetByAxis(0, 2) - t.z * C.GetByAxis(0, 0)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        9,
        s,
        eMax,
        new Vec3(C.GetByAxis(0, 2), 0, -C.GetByAxis(0, 0)),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.y, b.y )
      rA = extentA.x * absC.GetByAxis(1, 2) + extentA.z * absC.GetByAxis(1, 0)
      rB = extentB.x * absC.GetByAxis(2, 1) + extentB.z * absC.GetByAxis(0, 1)
      s =
        Math.abs(t.x * C.GetByAxis(1, 2) - t.z * C.GetByAxis(1, 0)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        10,
        s,
        eMax,
        new Vec3(C.GetByAxis(1, 2), 0, -C.GetByAxis(1, 0)),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.y, b.z )
      rA = extentA.x * absC.GetByAxis(2, 2) + extentA.z * absC.GetByAxis(2, 0)
      rB = extentB.x * absC.GetByAxis(1, 1) + extentB.y * absC.GetByAxis(0, 1)
      s =
        Math.abs(t.x * C.GetByAxis(2, 2) - t.z * C.GetByAxis(2, 0)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        11,
        s,
        eMax,
        new Vec3(C.GetByAxis(2, 2), 0, -C.GetByAxis(2, 0)),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.z, b.x )
      rA = extentA.x * absC.GetByAxis(0, 1) + extentA.y * absC.GetByAxis(0, 0)
      rB = extentB.y * absC.GetByAxis(2, 2) + extentB.z * absC.GetByAxis(1, 2)
      s =
        Math.abs(t.y * C.GetByAxis(0, 0) - t.x * C.GetByAxis(0, 1)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        12,
        s,
        eMax,
        new Vec3(-C.GetByAxis(0, 1), C.GetByAxis(0, 0), 0),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.z, b.y )
      rA = extentA.x * absC.GetByAxis(1, 1) + extentA.y * absC.GetByAxis(1, 0)
      rB = extentB.x * absC.GetByAxis(2, 2) + extentB.z * absC.GetByAxis(0, 2)
      s =
        Math.abs(t.y * C.GetByAxis(1, 0) - t.x * C.GetByAxis(1, 1)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        13,
        s,
        eMax,
        new Vec3(-C.GetByAxis(1, 1), C.GetByAxis(1, 0), 0),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)

      // Cross( a.z, b.z )
      rA = extentA.x * absC.GetByAxis(2, 1) + extentA.y * absC.GetByAxis(2, 0)
      rB = extentB.x * absC.GetByAxis(1, 2) + extentB.y * absC.GetByAxis(0, 2)
      s =
        Math.abs(t.y * C.GetByAxis(2, 0) - t.x * C.GetByAxis(2, 1)) - (rA + rB)
      trackFaceResult = this.TrackEdgeAxis(
        eAxis,
        14,
        s,
        eMax,
        new Vec3(-C.GetByAxis(2, 1), C.GetByAxis(2, 0), 0),
        nE,
      )

      if (trackFaceResult.success) return
      ({ axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult)
    }

    // Artificial axis bias to improve frame coherence
    const kRelTol = 0.95
    const kAbsTol = 0.01
    let axis
    let sMax
    let n = new Vec3()
    const faceMax = Math.max(aMax, bMax)

    if (kRelTol * eMax > faceMax + kAbsTol) {
      axis = eAxis
      sMax = eMax
      n = nE
    } else if (kRelTol * bMax > aMax + kAbsTol) {
      axis = bAxis
      sMax = bMax
      n = nB
    } else {
      axis = aAxis
      sMax = aMax
      n = nA
    }

    if (Vec3.Dot(n, Vec3.Sub(btx.position, atx.position)) < 0) n = Vec3.Inverse(n)

    if (axis < 6) {
      let rtx: Transform
      let itx: Transform
      let eR: Vec3
      let eI: Vec3
      let flip: boolean

      if (axis < 3) {
        rtx = atx
        itx = btx
        eR = extentA
        eI = extentB
        flip = false
      } else {
        rtx = btx
        itx = atx
        eR = extentB
        eI = extentA
        flip = true
        n = Vec3.Inverse(n)
      }

      // Compute reference and incident edge information necessary for clipping

      this.ComputeIncidentFace(itx, eI, n, this.incident)

      // basis: Mat3;
      // e: Vec3;
      const {
        basis,
        extent: e,
        result,
      } = this.ComputeReferenceEdgesAndBasis(eR, rtx, n, axis, this.clipEdges)
      // NOTE: maybe redundant assignment
      this.clipEdges = result

      // Clip the incident face against the reference face side planes
      const resultNumber = this.Clip(
        rtx.position,
        e,
        this.clipEdges,
        basis,
        this.incident,
        this.results,
        this.depths,
      )

      if (resultNumber != 0) {
        m.contactCount = resultNumber
        m.normal = flip ? Vec3.Inverse(n) : n

        for (let index = 0; index < resultNumber; ++index) {
          var c = m.contacts[index]

          var pair = this.results[index].f

          if (flip) {
            ;[pair.inI, pair.inR] = [pair.inR, pair.inI]
            ;[pair.outI, pair.outR] = [pair.outR, pair.outI]
          }

          c.fp = this.results[index].f
          c.position = this.results[index].v
          c.penetration = this.depths[index]
        }
      }
    } else {
      n = Mat3.MultiplyByVec3(atx.rotation, n)

      if (Vec3.Dot(n, Vec3.Sub(btx.position, atx.position)) < 0) {
        n = n.Inverse()
      }

      const { a: PA, b: QA } = this.SupportEdge(atx, extentA, n)

      const { a: PB, b: QB } = this.SupportEdge(btx, extentB, Vec3.Inverse(n))

      const { CA, CB } = this.EdgesContact(PA, QA, PB, QB)

      m.normal = n
      m.contactCount = 1

      var c = m.contacts[0]
      var pair = new FeaturePair()
      pair.key = axis
      c.fp = pair
      c.penetration = sMax
      c.position = Vec3.Scale(Vec3.Add(CA, CB), 0.5)
    }
  }
}

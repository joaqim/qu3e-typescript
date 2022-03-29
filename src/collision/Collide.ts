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

import { FixedArray } from "@containers";
import { FeaturePair, Manifold } from "@dynamics/Contact";
import Mat3 from "@math/Mat3";
import Transform from "@math/Transform";
import Vec3, { Vec3Axis } from "@math/Vec3";
import Box from "./Box";


class ClipVertex {
  // TODO: Better defaults
  public v!: Vec3
  public f!: FeaturePair

  constructor() {
    this.v = new Vec3(0, 0, 0)
  }
}

type TrackResult = {
  axis: number
  axisNormal: Vec3
  sMax: number
  success: boolean
}

export abstract class Collide {
  static input: ClipVertex[] = new Array<ClipVertex>(8)
  static result: ClipVertex[] = new Array<ClipVertex>(8)

  public static TrackFaceAxis(axis: number, n: number, s: number, sMax: number, normal: Vec3, axisNormal: Vec3): TrackResult {
    var result = false;

    if (s > 0) {
      result = true;
    } else if (s > sMax) {
      sMax = s
      axis = n
      axisNormal = normal
    }

    return {
      axis,
      axisNormal,
      sMax,
      success: result
    }
  }

  public static TrackEdgeAxis(axis: number, n: number, s: number, sMax: number, normal: Vec3, axisNormal: Vec3): TrackResult {
    var result = false;
    if (s > 0) {
      result = true
    } else {
      const l = 1 / Vec3.Length(normal);
      s *= l;

      if (s > sMax) {
        sMax = s;
        axis = n;
        //TODO: Find existing  vec multiply by number util function
        axisNormal.x = normal.x * l;
        axisNormal.y = normal.y * l;
        axisNormal.z = normal.z * l;
      }
    }

    return {
      axis,
      axisNormal,
      sMax,
      success: result
    }
  }



  public static ComputeReferenceEdgesAndBasis(eR: Vec3, rtx: Transform, n: Vec3, axis: number, result: FixedArray<4>) {
    var basis: Mat3 = new Mat3([0, 0, 0, 0, 0, 0, 0, 0, 0])
    var e: Vec3 = new Vec3(0, 0, 0)

    n = Transform.MulTMat3WithVec3(rtx.rotation, n)

    if (axis >= 3)
      axis -= 3

    switch (axis) {
      case 0:
        if (n.x > 0) {
          result[0] = 1
          result[1] = 8
          result[2] = 7
          result[3] = 9

          e.SetRow(eR.y, eR.z, eR.x)

          basis.SetRows(
            rtx.rotation.ey,
            rtx.rotation.ez,
            rtx.rotation.ex,
          );

        } else {
          result[0] = 11
          result[1] = 3
          result[2] = 10
          result[3] = 5

          e.SetRow(eR.z, eR.y, eR.x);
          basis.SetRows(rtx.rotation.ez, rtx.rotation.ey, rtx.rotation.ex.Inverse());

        }
      case 1:
        if (n.y > 0) {
          result[0] = 0
          result[1] = 1
          result[2] = 2
          result[3] = 3
          e.SetRow(eR.z, eR.x, eR.y);
          basis.SetRows(rtx.rotation.ez, rtx.rotation.ex, rtx.rotation.ey);

        } else {
          result[0] = 4
          result[1] = 5
          result[2] = 6
          result[3] = 7


          e.SetRow(eR.z, eR.x, eR.y);
          basis.SetRows(rtx.rotation.ez, rtx.rotation.ex.Inverse(), rtx.rotation.ey.Inverse());
        }
      case 2:
        if (n.z > 0) {
          result[0] = 11
          result[1] = 4
          result[2] = 8
          result[3] = 0


          e.SetRow(eR.y, eR.x, eR.z);
          basis.SetRows(rtx.rotation.ey.Inverse(), rtx.rotation.ex, rtx.rotation.ez);
        } else {
          result[0] = 6
          result[1] = 10
          result[2] = 2
          result[3] = 9

          e.SetRow(eR.y, eR.x, eR.z);
          basis.SetRows(rtx.rotation.ey.Inverse(), rtx.rotation.ex.Inverse(), rtx.rotation.ez.Inverse());
        }
    }
    return {
      basis,
      e,
      result
    }
  }

  public static ComputeIncidentFace(itx: Transform, e: Vec3, n: Vec3, result: ClipVertex[]): ClipVertex[] {
    n = Transform.MulTMat3WithVec3(itx.rotation, n).Inverse();

    var absN = Vec3.Abs(n)

    if (absN.x > absN.y && absN.x > absN.z) {
      if (n.x > 0) {
        result[0].v.SetRow(e.x, e.y, -e.z)
        result[1].v.SetRow(e.x, e.y, -e.z)
        result[2].v.SetRow(e.x, -e.y, e.z)
        result[3].v.SetRow(e.x, -e.y, -e.z)

        result[0].f.inI = 9;
        result[0].f.outI = 1;
        result[1].f.inI = 1;
        result[1].f.outI = 8;
        result[2].f.inI = 8;
        result[2].f.outI = 7;
        result[3].f.inI = 7;
        result[3].f.outI = 9;
      } else {
        result[0].v.SetRow(-e.x, -e.y, e.z)
        result[1].v.SetRow(-e.x, e.y, e.z)
        result[2].v.SetRow(-e.x, e.y, -e.z)
        result[3].v.SetRow(-e.x, -e.y, -e.z)

        result[0].f.inI = 5;
        result[0].f.outI = 11;
        result[1].f.inI = 11;
        result[1].f.outI = 3;
        result[2].f.inI = 3;
        result[2].f.outI = 10;
        result[3].f.inI = 10;
        result[3].f.outI = 5;
      }
    } else if (absN.y > absN.x && absN.y > absN.z) {
      if (n.y > 0) {
        result[0].v.SetRow(-e.x, e.y, e.z)
        result[1].v.SetRow(e.x, e.y, e.z)
        result[2].v.SetRow(e.x, e.y, -e.z)
        result[3].v.SetRow(-e.x, e.y, -e.z)

        result[0].f.inI = 3;
        result[0].f.outI = 0;
        result[1].f.inI = 0;
        result[1].f.outI = 1;
        result[2].f.inI = 1;
        result[2].f.outI = 2;
        result[3].f.inI = 2;
        result[3].f.outI = 3;
      } else {
        result[0].v.SetRow(e.x, -e.y, e.z)
        result[1].v.SetRow(-e.x, -e.y, e.z)
        result[2].v.SetRow(-e.x, -e.y, -e.z)
        result[3].v.SetRow(e.x, -e.y, -e.z)

        result[0].f.inI = 7;
        result[0].f.outI = 4;
        result[1].f.inI = 4;
        result[1].f.outI = 5;
        result[2].f.inI = 5;
        result[2].f.outI = 6;
        result[3].f.inI = 5;
        result[3].f.outI = 6;
      }
    }
    else {
      if (n.z > 0) {
        result[0].v.SetRow(-e.x, e.y, e.z)
        result[1].v.SetRow(-e.x, -e.y, e.z)
        result[2].v.SetRow(e.x, -e.y, e.z)
        result[3].v.SetRow(e.x, e.y, e.z)

        result[0].f.inI = 0;
        result[0].f.outI = 11;
        result[1].f.inI = 11;
        result[1].f.outI = 4;
        result[2].f.inI = 4;
        result[2].f.outI = 8;
        result[3].f.inI = 8;
        result[3].f.outI = 0;
      } else {
        result[0].v.SetRow(e.x, -e.y, -e.z)
        result[1].v.SetRow(-e.x, -e.y, -e.z)
        result[2].v.SetRow(-e.x, e.y, -e.z)
        result[3].v.SetRow(e.x, e.y, -e.z)

        result[0].f.inI = 9;
        result[0].f.outI = 6;
        result[1].f.inI = 6;
        result[1].f.outI = 10;
        result[2].f.inI = 10;
        result[2].f.outI = 2;
        result[3].f.inI = 2;
        result[3].f.outI = 9;
      }
    }

    for (var i = 0; i < 4; ++i) {
      result[i].v = Transform.MulTWithVec3(itx, result[i].v);
    }
    return result;
  }

  static InFront = (a: number): boolean => a < 0;
  static Behind = (a: number): boolean => a > 0;
  static On = (a: number): boolean => a < 0.005 && a > -0.005;
  static Sign = (v: number): number => v >= 0 ? 1 : -1;

  public static Orthographic(sign: number, e: number, axis: Vec3Axis, clipEdge: number, input: ClipVertex[], inCount: number, result: ClipVertex[]) {
    var resultCount = 0
    var a: ClipVertex = input[inCount - 1];

    for (var i = 0; i < inCount; ++i) {
      var b: ClipVertex = input[i];

      const da = sign * a.v.Get(axis) - e;
      const db = sign * b.v.Get(axis) - e;

      var cv = new ClipVertex();

      // B
      if (((this.InFront(da) && this.InFront(db)) || this.On(da) || this.On(db))) {

        //Assert(resultCount < 8);
        result[resultCount++] = b;
      }

      // I
      else if (this.InFront(da) && this.Behind(db)) {
        cv.f = b.f;

        //cv.v = a.v + (b.v - a.v) * (da / (da - db));
        cv.v = b.v.Sub(a.v).MultiplyByNumber(da / (da - db)).Add(a.v)

        cv.f.outR = clipEdge;
        cv.f.outI = 0;

        //Assert(resultCount < 8);
        result[resultCount++] = cv;
      }

      // I, B
      else if (this.Behind(da) && this.InFront(db)) {
        cv.f = a.f;

        //cv.v = a.v + (b.v - a.v) * (da / (da - db));
        cv.v = b.v.Sub(a.v).MultiplyByNumber(da / (da - db)).Add(a.v)

        cv.f.inR = clipEdge;
        cv.f.inI = 0;

        //Assert(resultCount < 8);
        result[resultCount++] = cv;


        //Assert(resultCount < 8);
        result[resultCount++] = b;
      }

      a = b;
    }

    return resultCount;
  }
  public static Clip(rPos: Vec3, e: Vec3, clipEdges: number[], basis: Mat3, incident: ClipVertex[], resultVerts: ClipVertex[], resultDepths: number[]): number {
    var inCount = 4;
    var resultCount;

    for (var i = 0; i < 4; ++i) {
      this.input[i].v = Transform.MulTMat3WithVec3(basis, incident[i].v.Sub(rPos))
    }

    resultCount = Collide.Orthographic(1, e.x, 0, clipEdges[0], this.input, inCount, this.result);

    if (resultCount == 0)
      return 0;

    inCount = Collide.Orthographic(1, e.y, 1, clipEdges[1], this.result, resultCount, this.input);

    if (inCount == 0)
      return 0;

    resultCount = Collide.Orthographic(-1, e.x, 0, clipEdges[2], this.input, inCount, this.result);

    if (resultCount == 0)
      return 0;

    inCount = Collide.Orthographic(-1, e.y, 1, clipEdges[3], this.result, resultCount, this.input);

    // Keep incident vertices behind the reference face
    resultCount = 0;
    for (var i = 0; i < inCount; ++i) {
      const d = this.input[i].v.z - e.z;

      if (d <= 0) {
        resultVerts[resultCount].v = Transform.MulMat3WithVec3(basis, this.input[i].v).Add(rPos);
        resultVerts[resultCount].f = this.input[i].f;
        resultDepths[resultCount++] = d;
      }
    }

    //Assert(resultCount <= 8);

    return resultCount;
  }

  //--------------------------------------------------------------------------------------------------
  public static EdgesContact(PA: Vec3, QA: Vec3, PB: Vec3, QB: Vec3): { CA: Vec3, CB: Vec3 } {
    const DA = QA.Sub(PA);
    const DB = QB.Sub(PB);

    const r = PA.Sub(PB);

    const a = Vec3.Dot(DA, DA);
    const e = Vec3.Dot(DB, DB);
    const f = Vec3.Dot(DB, r);
    const c = Vec3.Dot(DA, r);

    const b = Vec3.Dot(DA, DB);
    const denom = a * e - b * b;

    const TA = (b * f - c * e) / denom;
    const TB = (b * TA + f) / e;

    var CA = PA.Add(DA.MultiplyByNumber(TA))
    var CB = PA.Add(DB.MultiplyByNumber(TB))

    return { CA, CB }
  }

  //--------------------------------------------------------------------------------------------------
  public static SupportEdge(tx: Transform, e: Vec3, n: Vec3): { a: Vec3, b: Vec3 } {
    n = Transform.MulTMat3WithVec3(tx.rotation, n);
    const absN = Vec3.Abs(n);
    const a = new Vec3();
    const b = new Vec3();

    // x > y
    if (absN.x > absN.y) {
      // x > y > z
      if (absN.y > absN.z) {
        a.SetRow(e.x, e.y, e.z);
        b.SetRow(e.x, e.y, -e.z);
      }

      // x > z > y || z > x > y
      else {
        a.SetRow(e.x, e.y, e.z);
        b.SetRow(e.x, -e.y, e.z);
      }
    }

    // y > x
    else {
      // y > x > z
      if (absN.x > absN.z) {
        a.SetRow(e.x, e.y, e.z);
        b.SetRow(e.x, e.y, -e.z);
      }

      // z > y > x || y > z > x
      else {
        a.SetRow(e.x, e.y, e.z);
        b.SetRow(-e.x, e.y, e.z);
      }
    }

    const signx = this.Sign(n.x);
    const signy = this.Sign(n.y);
    const signz = this.Sign(n.z);

    a.x *= signx;
    a.y *= signy;
    a.z *= signz;
    b.x *= signx;
    b.y *= signy;
    b.z *= signz;

    return {
      a: Transform.MulWithVec3(tx, a),
      b: Transform.MulWithVec3(tx, b)
    }
  }

  //--------------------------------------------------------------------------------------------------
  // Caches for BoxtoBox
  static incident: FixedArray<4, ClipVertex>
  static clipEdges: FixedArray<4>
  static results = new Array<ClipVertex>(8)
  static depths = new Array<number>(8)

  // Resources:
  // http://www.randygaul.net/2014/05/22/deriving-obb-to-obb-intersection-sat/
  // https://box2d.googlecode.com/files/GDC2007_ErinCatto.zip
  // https://box2d.googlecode.com/files/Box2D_Lite.zip
  public static BoxtoBox(m: Manifold, a: Box, b: Box) {
    var atx = a.body.GetTransform();
    var btx = b.body.GetTransform();
    const aL = a.local;
    const bL = b.local;
    atx = Transform.Mul(atx, aL);
    btx = Transform.Mul(btx, bL);

    const eA = a.e;
    const eB = b.e;

    // B's frame input A's space
    const C = Mat3.Transpose(atx.rotation).Multiply(btx.rotation);

    const absC = new Mat3();
    var parallel = false;
    const kCosTol = 1e-6;

    for (var i = 0; i < 3; ++i) {
      for (var j = 0; j < 3; ++j) {

        var val = Math.abs(C.Get(i, j))

        var o = absC.GetAxis(i)

        o.Set(j, val)

        absC.SetRow(i, o)

        if (val + kCosTol >= 1)
          parallel = true;
      }
    }

    // Vector from center A to center B input A's space
    const t = Transform.MulTMat3WithVec3(atx.rotation, btx.position.Sub(atx.position))

    // Query states
    var s;
    var aMax = -Number.MAX_SAFE_INTEGER;
    var bMax = -Number.MAX_SAFE_INTEGER;
    var eMax = -Number.MAX_SAFE_INTEGER;

    var aAxis = ~0;
    var bAxis = ~0;
    var eAxis = ~0;

    var nA = new Vec3();
    var nB = new Vec3();
    var nE = new Vec3();

    // Face axis checks

    // a's x axis
    s = Math.abs(t.x) - (eA.x + Vec3.Dot(absC.ex, eB));
    var trackFaceResult = this.TrackFaceAxis(aAxis, 0, s, aMax, atx.rotation.ex, nA)
    if (trackFaceResult.success) return;
    var { axis: aAxis, sMax: aMax, axisNormal: nA } = trackFaceResult

    // a's y axis
    s = Math.abs(t.y) - (eA.y + Vec3.Dot(absC.ey, eB));
    trackFaceResult = this.TrackFaceAxis(aAxis, 1, s, aMax, atx.rotation.ey, nA)
    if (trackFaceResult.success) return;
    var { axis: aAxis, sMax: aMax, axisNormal: nA } = trackFaceResult

    // a's z axis
    s = Math.abs(t.z) - (eA.z + Vec3.Dot(absC.ez, eB));
    trackFaceResult = this.TrackFaceAxis(aAxis, 2, s, aMax, atx.rotation.ez, nA)
    if (trackFaceResult.success) return;
    var { axis: aAxis, sMax: aMax, axisNormal: nA } = trackFaceResult

    // b's x axis
    s = Math.abs(Vec3.Dot(t, C.ex)) - (eB.x + Vec3.Dot(absC.ex, eA));
    trackFaceResult = this.TrackFaceAxis(bAxis, 3, s, bMax, btx.rotation.ex, nB)
    if (trackFaceResult.success) return;
    var { axis: bAxis, sMax: bMax, axisNormal: nB } = trackFaceResult

    // b's y axis
    s = Math.abs(Vec3.Dot(t, C.ey)) - (eB.y + Vec3.Dot(absC.ey, eA));
    trackFaceResult = this.TrackFaceAxis(bAxis, 4, s, bMax, btx.rotation.ey, nB)
    if (trackFaceResult.success) return;
    var { axis: bAxis, sMax: bMax, axisNormal: nB } = trackFaceResult

    // b's z axis
    s = Math.abs(Vec3.Dot(t, C.ez)) - (eB.z + Vec3.Dot(absC.ez, eA));
    trackFaceResult = this.TrackFaceAxis(bAxis, 5, s, bMax, btx.rotation.ez, nB)
    if (trackFaceResult.success) return;
    var { axis: bAxis, sMax: bMax, axisNormal: nB } = trackFaceResult

    if (!parallel) {
      // Edge axis checks

      // Cross( a.x, b.x )
      var rA = eA.y * absC.Get(0, 2) + eA.z * absC.Get(0, 1);
      var rB = eB.y * absC.Get(2, 0) + eB.z * absC.Get(1, 0);

      s = Math.abs(t.z * C.Get(0, 1) - t.y * C.Get(0, 2)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 6, s, eMax, new Vec3(0, -C.Get(0, 2), C.Get(0, 1)), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.x, b.y )
      rA = eA.y * absC.Get(1, 2) + eA.z * absC.Get(1, 1);
      rB = eB.x * absC.Get(2, 0) + eB.z * absC.Get(0, 0);
      s = Math.abs(t.z * C.Get(1, 1) - t.y * C.Get(1, 2)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 7, s, eMax, new Vec3(0, -C.Get(1, 2), C.Get(1, 1)), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.x, b.z )
      rA = eA.y * absC.Get(2, 2) + eA.z * absC.Get(2, 1);
      rB = eB.x * absC.Get(1, 0) + eB.y * absC.Get(0, 0);
      s = Math.abs(t.z * C.Get(2, 1) - t.y * C.Get(2, 2)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 8, s, eMax, new Vec3(0, -C.Get(2, 2), C.Get(2, 1)), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.y, b.x )
      rA = eA.x * absC.Get(0, 2) + eA.z * absC.Get(0, 0);
      rB = eB.y * absC.Get(2, 1) + eB.z * absC.Get(1, 1);
      s = Math.abs(t.x * C.Get(0, 2) - t.z * C.Get(0, 0)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 9, s, eMax, new Vec3(C.Get(0, 2), 0, -C.Get(0, 0)), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.y, b.y )
      rA = eA.x * absC.Get(1, 2) + eA.z * absC.Get(1, 0);
      rB = eB.x * absC.Get(2, 1) + eB.z * absC.Get(0, 1);
      s = Math.abs(t.x * C.Get(1, 2) - t.z * C.Get(1, 0)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 10, s, eMax, new Vec3(C.Get(1, 2), 0, -C.Get(1, 0)), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.y, b.z )
      rA = eA.x * absC.Get(2, 2) + eA.z * absC.Get(2, 0);
      rB = eB.x * absC.Get(1, 1) + eB.y * absC.Get(0, 1);
      s = Math.abs(t.x * C.Get(2, 2) - t.z * C.Get(2, 0)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 11, s, eMax, new Vec3(C.Get(2, 2), 0, -C.Get(2, 0)), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.z, b.x )
      rA = eA.x * absC.Get(0, 1) + eA.y * absC.Get(0, 0);
      rB = eB.y * absC.Get(2, 2) + eB.z * absC.Get(1, 2);
      s = Math.abs(t.y * C.Get(0, 0) - t.x * C.Get(0, 1)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 12, s, eMax, new Vec3(-C.Get(0, 1), C.Get(0, 0), 0), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.z, b.y )
      rA = eA.x * absC.Get(1, 1) + eA.y * absC.Get(1, 0);
      rB = eB.x * absC.Get(2, 2) + eB.z * absC.Get(0, 2);
      s = Math.abs(t.y * C.Get(1, 0) - t.x * C.Get(1, 1)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 13, s, eMax, new Vec3(-C.Get(1, 1), C.Get(1, 0), 0), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult

      // Cross( a.z, b.z )
      rA = eA.x * absC.Get(2, 1) + eA.y * absC.Get(2, 0);
      rB = eB.x * absC.Get(1, 2) + eB.y * absC.Get(0, 2);
      s = Math.abs(t.y * C.Get(2, 0) - t.x * C.Get(2, 1)) - (rA + rB);
      trackFaceResult = this.TrackEdgeAxis(eAxis, 14, s, eMax, new Vec3(-C.Get(2, 1), C.Get(2, 0), 0), nE)
      if (trackFaceResult.success) return
      var { axis: eAxis, sMax: eMax, axisNormal: nE } = trackFaceResult
    }

    // Artificial axis bias to improve frame coherence
    const kRelTol = 0.95;
    const kAbsTol = 0.01;
    var axis;
    var sMax;
    var n = new Vec3();
    const faceMax = Math.max(aMax, bMax);

    if (kRelTol * eMax > faceMax + kAbsTol) {
      axis = eAxis;
      sMax = eMax;
      n = nE;
    }

    else {
      if (kRelTol * bMax > aMax + kAbsTol) {
        axis = bAxis;
        sMax = bMax;
        n = nB;
      }

      else {
        axis = aAxis;
        sMax = aMax;
        n = nA;
      }
    }

    if (Vec3.Dot(n, btx.position.Sub(atx.position)) < 0)
      n = n.Inverse()

    if (axis < 6) {
      var rtx: Transform
      var itx: Transform
      var eR: Vec3
      var eI: Vec3
      var flip: boolean

      if (axis < 3) {
        rtx = atx;
        itx = btx;
        eR = eA;
        eI = eB;
        flip = false;
      }

      else {
        rtx = btx;
        itx = atx;
        eR = eB;
        eI = eA;
        flip = true;
        n = n.Inverse();
      }

      // Compute reference and incident edge information necessary for clipping

      this.ComputeIncidentFace(itx, eI, n, this.incident)

      //basis: Mat3;
      //e: Vec3;
      var { basis, e, result } = this.ComputeReferenceEdgesAndBasis(eR, rtx, n, axis, this.clipEdges);
      //NOTE: maybe redundant assignment
      this.clipEdges = result

      // Clip the incident face against the reference face side planes
      var resultNum = this.Clip(rtx.position, e, this.clipEdges, basis, this.incident, this.results, this.depths);

      if (resultNum != 0) {
        m.contactCount = resultNum;
        m.normal = flip ? n.Inverse() : n;
        for (var i = 0; i < resultNum; ++i) {
          var c = m.contacts[i];

          var pair = this.results[i].f;

          if (flip) {
            [pair.inI, pair.inR] = [pair.inR, pair.inI];
            [pair.outI, pair.outR] = [pair.outR, pair.outI]
          }

          c.fp = this.results[i].f;
          c.position = this.results[i].v;
          c.penetration = this.depths[i];
        }
      }
    }

    else {
      n = atx.rotation.MultiplyByVec3(n);

      if (Vec3.Dot(n, btx.position.Sub(atx.position)) < 0) {
        n = n.Inverse();
      }

      var { a: PA, b: QA } = this.SupportEdge(atx, eA, n);

      var { a: PB, b: QB } = this.SupportEdge(btx, eB, n.Inverse());

      var { CA, CB } = this.EdgesContact(PA, QA, PB, QB);

      m.normal = n;
      m.contactCount = 1;

      var c = m.contacts[0];
      var pair = new FeaturePair();
      pair.key = axis;
      c.fp = pair;
      c.penetration = sMax;
      c.position = CA.Add(CB).MultiplyByNumber(0.5);
    }
  }
}
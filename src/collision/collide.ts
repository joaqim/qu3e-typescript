import { FixedArray } from "@containers";
import { Transform } from "@math/transform";
import { mat3, vec3 } from "gl-matrix";
import '@extensions/vec3'

type TrackResult = {
  axis: number
  axisNormal: vec3
  sMax: number
  result: boolean
}


type FeaturePair = {
  inI: number | undefined
  inR: number | undefined
  outI: number | undefined
  outR: number | undefined
}


export class ClipVertex {
  public v: vec3
  // TODO: Better default value
  public f!: FeaturePair

  constructor() {
    this.v = [0, 0, 0]
  }
}

function Abs(v: vec3): vec3 {
  return [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])]
}

function CreateMatrix(x: vec3, y: vec3, z: vec3): mat3 {
  return [
    x[0], y[0], z[0],
    x[1], y[1], z[1],
    x[2], y[2], z[2],
  ]
}


export abstract class Collide {
  public static TrackFaceAxis(axis: number, n: number, s: number, sMax: number, normal: vec3, axisNormal: vec3): TrackResult {
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
      result
    }
  }

  public static TrackEdgeAxis(axis: number, n: number, s: number, sMax: number, normal: vec3, axisNormal: vec3): TrackResult {
    var result = false;
    if (s > 0) {
      result = true
    } else {
      const l = 1 / vec3.length(normal);
      s *= l;

      if (s > sMax) {
        sMax = s;
        axis = n;
        //TODO: Find existing  vec multiply by number util function
        axisNormal[0] = normal[0] * l;
        axisNormal[1] = normal[1] * l;
        axisNormal[2] = normal[2] * l;
      }
    }

    return {
      axis,
      axisNormal,
      sMax,
      result
    }
  }



  public static ComputeReferenceEdgesAndBasis(eR: vec3, rtx: Transform, n: vec3, axis: number) {
    var result: FixedArray<4> = [0, 0, 0, 0]
    var basis: mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    var e: vec3

    n = Transform.MulT(rtx.rotation, n)

    if (axis >= 3)
      axis -= 3

    switch (axis) {
      case 0:
        if (n[0] > 0) {
          result[0] = 1
          result[1] = 8
          result[2] = 7
          result[3] = 9

          e = [eR[1], eR[2], eR[0]]
          basis = [
            rtx.rotation[6], rtx.rotation[7], rtx.rotation[8],
            rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
            -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2]
          ]
        } else {
          result[0] = 11
          result[1] = 3
          result[2] = 10
          result[3] = 5

          e = [eR[2], eR[1], eR[0]]
          basis = [
            rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
            rtx.rotation[6], rtx.rotation[7], rtx.rotation[8],
            -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2]
          ]
        }
      case 1:
        if (n[2] > 0) {
          result[0] = 0
          result[1] = 1
          result[2] = 2
          result[3] = 3

          e = [eR[2], eR[0], eR[1]]
          basis = [
            rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
            rtx.rotation[0], rtx.rotation[1], rtx.rotation[2],
            rtx.rotation[6], rtx.rotation[7], rtx.rotation[8]
          ]
        } else {
          result[0] = 4
          result[1] = 5
          result[2] = 6
          result[3] = 7

          e = [eR[2], eR[0], eR[1]]
          basis = [
            rtx.rotation[3], rtx.rotation[4], rtx.rotation[5],
            -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2],
            -rtx.rotation[6], -rtx.rotation[7], -rtx.rotation[8]
          ]
        }
      case 2:
        if (n[2] > 0) {
          result[0] = 11
          result[1] = 4
          result[2] = 8
          result[3] = 0

          e = [eR[1], eR[0], eR[2]]
          basis = [
            -rtx.rotation[3], -rtx.rotation[4], -rtx.rotation[5],
            rtx.rotation[0], rtx.rotation[1], rtx.rotation[2],
            rtx.rotation[6], rtx.rotation[7], rtx.rotation[8]
          ]
        } else {
          result[0] = 6
          result[1] = 10
          result[2] = 2
          result[3] = 9

          e = [eR[1], eR[0], eR[2]]
          basis = [
            -rtx.rotation[3], -rtx.rotation[4], -rtx.rotation[5],
            -rtx.rotation[0], -rtx.rotation[1], -rtx.rotation[2],
            -rtx.rotation[6], -rtx.rotation[7], -rtx.rotation[8]
          ]
        }
    }
    return {
      basis,
      result
    }
  }

  public static ComputeIncidentFaces(itx: Transform, e: vec3, n: vec3, result: ClipVertex[]): ClipVertex[] {
    var mt = Transform.MulT(itx.rotation, n);
    n = [-mt[0], -mt[1], -mt[2]]

    var absN = vec3.abs(n)

    if (absN[0] > absN[1] && absN[0] > absN[2]) {
      if (n[0] > 0) {
        result[0].v = [e[0], e[1], -e[2]]
        result[1].v = [e[0], e[1], e[2]]
        result[2].v = [e[0], -e[1], e[2]]
        result[3].v = [e[0], -e[1], -e[2]]

        result[0].f.inI = 9;
        result[0].f.outI = 1;
        result[1].f.inI = 1;
        result[1].f.outI = 8;
        result[2].f.inI = 8;
        result[2].f.outI = 7;
        result[3].f.inI = 7;
        result[3].f.outI = 9;
      } else {
        result[0].v = [-e[0], -e[1], e[2]]
        result[1].v = [-e[0], e[1], e[2]]
        result[2].v = [-e[0], e[1], -e[2]]
        result[3].v = [-e[0], -e[1], -e[2]]

        result[0].f.inI = 5;
        result[0].f.outI = 11;
        result[1].f.inI = 11;
        result[1].f.outI = 3;
        result[2].f.inI = 3;
        result[2].f.outI = 10;
        result[3].f.inI = 10;
        result[3].f.outI = 5;
      }
    } else if (absN[2] > absN[0] && absN[1] > absN[2]) {
      if (n[1] > 0) {
        result[0].v = [-e[0], e[1], e[2]]
        result[1].v = [e[0], e[1], e[2]]
        result[2].v = [e[0], e[1], -e[2]]
        result[3].v = [-e[0], e[1], -e[2]]

        result[0].f.inI = 3;
        result[0].f.outI = 0;
        result[1].f.inI = 0;
        result[1].f.outI = 1;
        result[2].f.inI = 1;
        result[2].f.outI = 2;
        result[3].f.inI = 2;
        result[3].f.outI = 3;
      } else {
        result[0].v = [e[0], -e[1], e[2]]
        result[1].v = [-e[0], -e[1], e[2]]
        result[2].v = [-e[0], -e[1], -e[2]]
        result[3].v = [e[0], -e[1], -e[2]]

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
      if (n[2] > 0) {
        result[0].v = [-e[0], e[1], e[2]]
        result[1].v = [-e[0], -e[1], e[2]]
        result[2].v = [e[0], -e[1], e[2]]
        result[3].v = [e[0], e[1], e[2]]

        result[0].f.inI = 0;
        result[0].f.outI = 11;
        result[1].f.inI = 11;
        result[1].f.outI = 4;
        result[2].f.inI = 4;
        result[2].f.outI = 8;
        result[3].f.inI = 8;
        result[3].f.outI = 0;
      } else {
        result[0].v = [e[0], -e[1], -e[2]]
        result[1].v = [-e[0], -e[1], -e[2]]
        result[2].v = [-e[0], e[1], -e[2]]
        result[3].v = [e[0], e[1], -e[2]]

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
      result[i].v = Transform.MulT(itx, result[i].v);
    }
    return result;
  }

  static InFront = (a: number): boolean => a < 0;
  static Behind = (a: number): boolean => a > 0;
  static On = (a: number): boolean => a < 0.005 && a > -0.005;

  public static Orthographic(sign: number, e: number, axis: number, clipEdge: number, input: ClipVertex[], inCount: number, result: ClipVertex[]) {
    var resultCount = 0
    var a: ClipVertex = input[inCount - 1];

    for (var i = 0; i < inCount; ++i) {
      var b = input[i];

      const da = sign * a.v[axis] - e;
      const db = sign * b.v[axis] - e;

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
        vec3.subtract(cv.v, b.v, a.v)
        vec3.multiply(cv.v, cv.v, da / (da - db))
        vec3.add(cv.v, a.v, cv.v)

        cv.f.outR = clipEdge;
        cv.f.outI = 0;

        //Assert(resultCount < 8);
        result[resultCount++] = cv;
      }

      // I, B
      else if (this.Behind(da) && this.InFront(db)) {
        cv.f = a.f;
        //cv.v = a.v + (b.v - a.v) * (da / (da - db));

        vec3.subtract(cv.v, b.v, a.v)
        vec3.multiply(cv.v, cv.v, da / (da - db))
        vec3.add(cv.v, a.v, cv.v)

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

}
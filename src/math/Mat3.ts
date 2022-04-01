/* eslint-disable unicorn/prevent-abbreviations */
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
import type { ReadonlyVec3, Vec3Axis } from "./Vec3"
import { Vec3 } from "./Vec3"

export type Mat3Index = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Mat3Axis = 0 | 1 | 2
// eslint-disable-next-line no-use-before-define
export type ReadonlyMat3 = Readonly<Mat3>

type Mat3Keys = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i"

type Matrix3 = {
  [key in Mat3Keys]: number
}

export class Mat3 {
  public values!: {
    a: number
    b: number
    c: number
    d: number
    e: number
    f: number
    g: number
    h: number
    i: number
  }

  public constructor(
    payload?: Matrix3 | [a: Vec3, b: Vec3, c: Vec3] | FixedArray<9>,
  ) {
    if (Array.isArray(payload)) {
      this.SetRowsFromArray(payload)
    } else {
      this.values = <Matrix3>payload
    }
  }

  public SetCell(key: Mat3Keys | number, value: number): Mat3 {
    if (Number.isInteger(key)) {
      switch (key) {
        case 0:
          this.values.a = value
          break
        case 1:
          this.values.b = value
          break
        case 2:
          this.values.c = value
          break
        case 3:
          this.values.d = value
          break
        case 4:
          this.values.e = value
          break
        case 5:
          this.values.f = value
          break
        case 6:
          this.values.g = value
          break
        case 7:
          this.values.h = value
          break
        case 8:
          this.values.i = value
          break
        default:
          Assert(false)
      }
    } else {
      this.values[<Mat3Keys>key] = value
    }
    return this
  }

  public SetCells(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    index: number,
  ): Mat3 {
    this.values = {
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h,
      i: index,
    }
    return this
  }

  public Set(axis: ReadonlyVec3, angle: number): Mat3 {
    const s = Math.sin(angle)
    const c = Math.cos(angle)
    const x = axis.x
    const y = axis.y
    const z = axis.z
    const xy = x * y
    const yz = y * z
    const zx = z * x
    const t = 1 - c

    this.SetCells(
      x * x * t + c,
      xy * t + z * s,
      zx * t - y * s,
      xy * t - z * s,
      y * y * t + c,
      yz * t + x * s,
      zx * t + y * s,
      yz * t - x * s,
      z * z * t + c,
    )
    return this
  }

  public SetRowsFromArray(
    array: [a: ReadonlyVec3, b: ReadonlyVec3, c: ReadonlyVec3] | FixedArray<9>,
  ): Mat3 {
    if (array.length === 3) {
      this.SetRows(...array)
    } else {
      this.SetCells(...array)
    }
    return this
  }

  public SetRows(v1: ReadonlyVec3, v2: ReadonlyVec3, v3: ReadonlyVec3): Mat3 {
    this.SetCells(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z)
    return this
  }

  public SetRow(axis: Mat3Axis | number, value: Vec3): void {
    switch (axis) {
      case 0:
        this.ex = value
        break
      case 1:
        this.ey = value
        break
      case 2:
        this.ez = value
        break
      default:
        Assert(false)
    }
  }

  public Column0 = (): Vec3 =>
    new Vec3(this.values.a, this.values.b, this.values.c)

  public Column1 = (): Vec3 =>
    new Vec3(this.values.d, this.values.e, this.values.f)

  public Column2 = (): Vec3 =>
    new Vec3(this.values.g, this.values.h, this.values.i)

  public get ex(): Vec3 {
    return this.Column0()
  }

  public set ex(v: Vec3) {
    this.values.a = v.x
    this.values.b = v.y
    this.values.c = v.z
  }

  public get ey(): Vec3 {
    return this.Column1()
  }

  public set ey(v: Vec3) {
    this.values.d = v.x
    this.values.e = v.y
    this.values.f = v.z
  }

  public get ez(): Vec3 {
    return this.Column2()
  }

  public set ez(v: Vec3) {
    this.values.g = v.x
    this.values.h = v.y
    this.values.i = v.z
  }

  public static MultiplyByVec3(m: ReadonlyMat3, v: ReadonlyVec3): Vec3 {
    return new Vec3(
      m.values.a * v.x + m.values.b * v.y + m.values.c * v.z,
      m.values.d * v.x + m.values.e * v.y + m.values.f * v.z,
      m.values.g * v.x + m.values.h * v.y + m.values.i * v.z,
    )
  }

  public static Scale(lhs: Mat3, n: number): Mat3 {
    lhs.ex = Vec3.MultiplyByNumber(lhs.ex, n)
    lhs.ey = Vec3.MultiplyByNumber(lhs.ey, n)
    lhs.ez = Vec3.MultiplyByNumber(lhs.ez, n)
    return lhs
  }

  public Multiply(m: ReadonlyMat3): Mat3 {
    this.ex = Mat3.MultiplyByVec3(this, m.ex)
    this.ey = Mat3.MultiplyByVec3(this, m.ey)
    this.ez = Mat3.MultiplyByVec3(this, m.ez)
    return this
  }

  public MultiplyByNumber(n: number): Mat3 {
    this.ex = Vec3.MultiplyByNumber(this.ex, n)
    this.ey = Vec3.MultiplyByNumber(this.ey, n)
    this.ez = Vec3.MultiplyByNumber(this.ez, n)
    return this
  }

  public Scale(n: number): Mat3 {
    this.ex = Vec3.MultiplyByNumber(this.ex, n)
    this.ey = Vec3.MultiplyByNumber(this.ey, n)
    this.ez = Vec3.MultiplyByNumber(this.ez, n)
    return this
  }

  // TODO: Make sure this is correct
  public MultiplyByVec3(v: ReadonlyVec3): Mat3 {
    this.ex = Vec3.MultiplyByNumber(this.ex, v.x)
    this.ey = Vec3.MultiplyByNumber(this.ey, v.y)
    this.ez = Vec3.MultiplyByNumber(this.ez, v.z)
    return this
  }

  public Add(rhs: ReadonlyMat3): Mat3 {
    this.ex = Vec3.Add(this.ex, rhs.ex)
    this.ey = Vec3.Add(this.ey, rhs.ey)
    this.ez = Vec3.Add(this.ez, rhs.ez)
    return this
  }

  public Sub(rhs: ReadonlyMat3): Mat3 {
    this.ex = Vec3.Sub(this.ex, rhs.ex)
    this.ey = Vec3.Sub(this.ey, rhs.ey)
    this.ez = Vec3.Sub(this.ez, rhs.ez)
    return this
  }

  public GetAxis(axis: Mat3Axis | number): Vec3 {
    switch (<Mat3Axis>axis) {
      case 0:
        return this.ex
      case 1:
        return this.ey
      case 2:
        return this.ez
      default:
        Assert(false)
    }
    return Vec3.Identity()
  }

  public Get(index: Mat3Index): number {
    switch (index) {
      case 0:
        return this.values.a
      case 1:
        return this.values.b
      case 2:
        return this.values.c
      case 3:
        return this.values.d
      case 4:
        return this.values.e
      case 5:
        return this.values.f
      case 6:
        return this.values.g
      case 7:
        return this.values.h
      case 8:
        return this.values.i
      default:
        Assert(false)
    }
    return -1
  }

  public GetCellByKey(key: Mat3Keys): number {
    return this.values[key]
  }

  public GetByAxis(
    axis: Mat3Axis | number,
    vecAxis: Vec3Axis | number,
  ): number {
    return this.GetAxis(<Vec3Axis>axis).Get(<Vec3Axis>vecAxis)
  }

  public static Identity = (): Mat3 => new Mat3([1, 0, 0, 0, 1, 0, 0, 0, 1])

  public static Rotate = (
    x: ReadonlyVec3,
    y: ReadonlyVec3,
    z: ReadonlyVec3,
  ): Mat3 => new Mat3([x, y, z])

  public static Sub = (lhs: ReadonlyMat3, rhs: ReadonlyMat3): Mat3 =>
    new Mat3([
      Vec3.Sub(lhs.ex, rhs.ex),
      Vec3.Sub(lhs.ey, rhs.ey),
      Vec3.Sub(lhs.ez, rhs.ez),
    ])

  public static Multiply(lhs: ReadonlyMat3, rhs: ReadonlyMat3): Mat3 {
    return new Mat3([
      Mat3.MultiplyByVec3(lhs, rhs.ex),
      Mat3.MultiplyByVec3(lhs, rhs.ey),
      Mat3.MultiplyByVec3(lhs, rhs.ez),
    ])
  }

  public static Transpose = (m: ReadonlyMat3): Mat3 =>
    new Mat3([
      m.values.a,
      m.values.d,
      m.values.g,
      m.values.b,
      m.values.e,
      m.values.h,
      m.values.c,
      m.values.f,
      m.values.i,
    ])

  public static Zero = (m?: Mat3): Mat3 => {
    if (!m) m = new Mat3()
    return m.SetCells(0, 0, 0, 0, 0, 0, 0, 0, 0)
  }

  public static Diagonal = (a: number, b?: number, c?: number): Mat3 => {
    if (!b) b = a

    if (!c) c = a
    return new Mat3([a, 0, 0, 0, b, 0, 0, 0, c])
  }

  // TODO: make sure this function works
  public static OuterProduct = (u: ReadonlyVec3, v: ReadonlyVec3): Mat3 =>
    new Mat3([
      Vec3.MultiplyByNumber(v, u.x),
      Vec3.MultiplyByNumber(v, u.y),
      Vec3.MultiplyByNumber(v, u.z),
    ])

  public static Covariance(points: Vec3[], numberPoints: number): Mat3 {
    const invNumberPoints = 1 / numberPoints

    const c = new Vec3(0, 0, 0)

    for (let index = 0; index < numberPoints; index += 1) {
      c.Add(points[index])
    }

    c.DivideByNumber(numberPoints)

    let m00 = 0
    let m11 = 0
    let m22 = 0
    let m01 = 0
    let m02 = 0
    let m12 = 0

    for (let index = 0; index < numberPoints; index += 1) {
      const p = points[index].Sub(c)

      m00 += p.x * p.x
      m11 += p.y * p.y
      m22 += p.z * p.z
      m01 += p.x * p.y
      m02 += p.x * p.z
      m12 += p.y * p.z
    }

    const m01inv = m01 * invNumberPoints
    const m02inv = m02 * invNumberPoints
    const m12inv = m12 * invNumberPoints

    return new Mat3([
      m00 * invNumberPoints,
      m01inv,
      m02inv,
      m01inv,
      m11 * invNumberPoints,
      m12inv,
      m02inv,
      m12inv,
      m22 * invNumberPoints,
    ])
  }

  public static Inverse(m: ReadonlyMat3): Mat3 {
    const temporary0 = Vec3.Cross(m.ey, m.ez)
    const temporary1 = Vec3.Cross(m.ez, m.ex)
    const temporary2 = Vec3.Cross(m.ex, m.ey)

    const detinv = 1 / Vec3.Dot(m.ez, temporary2)

    return new Mat3([
      temporary0.x * detinv,
      temporary1.x * detinv,
      temporary2.x * detinv,
      temporary0.y * detinv,
      temporary1.y * detinv,
      temporary2.y * detinv,
      temporary0.z * detinv,
      temporary1.z * detinv,
      temporary2.z * detinv,
    ])
  }
}

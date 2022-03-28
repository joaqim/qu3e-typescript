import { FixedArray } from "@containers"
import Vec3 from "./Vec3"

type Mat3Keys =
    'a' | 'b' | 'c' |
    'd' | 'e' | 'f' |
    'g' | 'h' | 'i';

type Matrix3 = {
    [key in Mat3Keys]: number
}

export default class Mat3 {
    values!: {
        a: number, b: number, c: number,
        d: number, e: number, f: number,
        g: number, h: number, i: number
    };

    constructor(values: Matrix3 | [a: Vec3, b: Vec3, c: Vec3] | FixedArray<9>) {
        if (Array.isArray(values)) {
            this.SetRowsFromArray(values)
        } else {
            this.values = <Matrix3>values
        }
    }

    SetCells(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) {
        this.values = {
            a, b, c,
            d, e, f,
            g, h, i
        }
        return this
    }

    Set(axis: Vec3, angle: number) {
        const s = Math.sin(angle)
        const c = Math.cos(angle)
        const x = axis.v.x
        const y = axis.v.y
        const z = axis.v.z
        const xy = x * y
        const yz = y * z
        const zx = z * x
        const t = 1 - c

        this.SetCells(
            x * x * t + c, xy * t + z * s, zx * t - y * s,
            xy * t - z * s, y * y * t + c, yz * t + x * s,
            zx * t + y * s, yz * t - x * s, z * z * t + c
        )
        return this
    }

    SetRowsFromArray(array: [a: Vec3, b: Vec3, c: Vec3] | FixedArray<9>) {
        if (array.length == 3) {
            this.SetRows(...array)
        } else {
            this.SetCells(...array)
        }
        return this
    }

    SetRows(v1: Vec3, v2: Vec3, v3: Vec3) {
        this.SetCells(
            v1.v.x, v1.v.y, v1.v.z,
            v2.v.x, v2.v.y, v2.v.z,
            v3.v.x, v3.v.y, v3.v.z,
        )
        return this
    }

    Column0 = () => new Vec3({ x: this.values.a, y: this.values.b, z: this.values.c })
    Column1 = () => new Vec3({ x: this.values.d, y: this.values.e, z: this.values.f })
    Column2 = () => new Vec3({ x: this.values.g, y: this.values.h, z: this.values.i })
    GetX = () => this.Column0()
    GetY = () => this.Column1()
    GetZ = () => this.Column2()

    MultiplyByVec3(v: Vec3): Vec3 {
        return new Vec3(
            {
                x: this.values.a * v.v.x + this.values.b * v.v.y + this.values.c * v.v.z,
                y: this.values.d * v.v.x + this.values.e * v.v.y + this.values.f * v.v.z,
                z: this.values.g * v.v.x + this.values.h * v.v.y + this.values.i * v.v.z,
            }
        )
    }

    MultiplyByMat3(m: Mat3) {
        return new Mat3([
            this.MultiplyByVec3(m.Column0()),
            this.MultiplyByVec3(m.Column1()),
            this.MultiplyByVec3(m.Column2())
        ])
    }

    MultiplyByNumber(n: number) {
        return new Mat3(
            [
                this.Column0().MultiplyByNumber(n),
                this.Column1().MultiplyByNumber(n),
                this.Column2().MultiplyByNumber(n)
            ]
        )
    }

    AddMat3(m: Mat3) {
        return new Mat3(
            [
                this.Column0().AddVec3(m.Column0()),
                this.Column1().AddVec3(m.Column1()),
                this.Column2().AddVec3(m.Column2())
            ]
        )
    }

    SubMat3(m: Mat3) {
        return new Mat3(
            [
                this.Column0().SubVec3(m.Column0()),
                this.Column1().SubVec3(m.Column1()),
                this.Column2().SubVec3(m.Column2())
            ]
        )
    }

    public static Identity = () => new Mat3([1, 0, 0, 0, 1, 0, 0, 0, 1])

    public static Rotate = (x: Vec3, y: Vec3, z: Vec3) => new Mat3([x, y, z])
    public static Transpose = (m: Mat3) =>
        new Mat3([
            m.values.a, m.values.d, m.values.g,
            m.values.b, m.values.e, m.values.h,
            m.values.c, m.values.f, m.values.i
        ]);

    public static Zero = (m: Mat3) =>
        m.SetCells(0, 0, 0, 0, 0, 0, 0, 0, 0)

    public static Diagonal = (a: number, b: number, c: number) =>
        new Mat3([
            a, 0, 0,
            0, b, 0,
            0, 0, c
        ])

    public static OuterProduct(u: Vec3, v: Vec3): Mat3 {
        return new Mat3([
            v.MultiplyByNumber(u.v.x),
            v.MultiplyByNumber(u.v.x),
            v.MultiplyByNumber(u.v.x)
        ])
    }

    public static Covariance(points: Vec3[], numPoints: number): Mat3 {
        const invNumPoints = 1 / numPoints;

        var c = new Vec3([0, 0, 0])

        for (var i = 0; i < numPoints; ++i) {
            c.AddVec3(points[i])
        }

        c.DivideByNumber(numPoints)

        var m00, m11, m22, m01, m02, m12
        m00 = m11 = m22 = m01 = m02 = m12 = 0

        for (var i = 0; i < numPoints; ++i) {
            var p = points[i].SubVec3(c)

            m00 += p.v.x * p.v.x
            m11 += p.v.y * p.v.y
            m22 += p.v.z * p.v.z
            m01 += p.v.x * p.v.y
            m02 += p.v.x * p.v.z
            m12 += p.v.y * p.v.z
        }

        var m01inv = m01 * invNumPoints
        var m02inv = m02 * invNumPoints
        var m12inv = m12 * invNumPoints

        return new Mat3([
            m00 * invNumPoints, m01inv, m02inv,
            m01inv, m11 * invNumPoints, m12inv,
            m02inv, m12inv, m22 * invNumPoints
        ])
    }

    public static Inverse(m: Mat3): Mat3 {
        var tmp0, tmp1, tmp2
        var detinv

        tmp0 = Vec3.Cross(m.GetY(), m.GetZ())
        tmp1 = Vec3.Cross(m.GetZ(), m.GetX())
        tmp2 = Vec3.Cross(m.GetX(), m.GetY())

        detinv = 1 / Vec3.Dot(m.GetZ(), tmp2)

        return new Mat3([
            tmp0.v.x * detinv, tmp1.v.x * detinv, tmp2.v.x * detinv,
            tmp0.v.y * detinv, tmp1.v.y * detinv, tmp2.v.y * detinv,
            tmp0.v.z * detinv, tmp1.v.z * detinv, tmp2.v.z * detinv
        ])
    }
}
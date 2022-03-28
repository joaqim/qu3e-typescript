type Vec3Keys = 'x' | 'y' | 'z'

type Vec3Values = {
    [key in Vec3Keys]: number
}

export default class Vec3 {
    v!: { x: number; y: number; z: number; };

    constructor(values: Vec3Values | [x: number, y: number, z: number]) {
        if (Array.isArray(values)) {
            this.SetFromArray(values);
        } else {
            this.v = <Vec3Values>values;
        }
    }

    Set(x: number, y: number, z: number): Vec3 {
        this.v = { x, y, z };
        return this;
    }

    SetAll(v: number) {
        return this.Set(v, v, v);
    }

    SetFromArray(array: [x: number, y: number, z: number]) {
        return this.Set(...array);
    }

    AddVec3(lhs: Vec3): Vec3 {
        return new Vec3([
            this.v.x + lhs.v.x,
            this.v.y + lhs.v.y,
            this.v.z + lhs.v.z
        ]);
    }

    SubVec3(lhs: Vec3): Vec3 {
        return new Vec3([
            this.v.x - lhs.v.x,
            this.v.y - lhs.v.y,
            this.v.z - lhs.v.z
        ]);
    }

    MultiplyByVec3(lhs: Vec3): Vec3 {
        return new Vec3([
            this.v.x * lhs.v.x,
            this.v.y * lhs.v.y,
            this.v.z * lhs.v.z
        ]);
    }

    MultiplyByNumber(n: number): Vec3 {
        return new Vec3([
            this.v.x * n,
            this.v.y * n,
            this.v.z * n
        ]);
    }

    DivideByNumber(n: number): Vec3 {
        return new Vec3([
            this.v.x / n,
            this.v.y / n,
            this.v.z / n
        ]);
    }


    public static Dot = (a: Vec3, b: Vec3): number => a.v.x * b.v.x + a.v.y * b.v.y + a.v.z * b.v.z;
    public static Cross = (a: Vec3, b: Vec3): Vec3 => new Vec3([
        a.v.y * b.v.z - b.v.y * a.v.z,
        b.v.x * a.v.z - a.v.x * b.v.z,
        a.v.x * b.v.y - b.v.x * a.v.y,
    ]);

}

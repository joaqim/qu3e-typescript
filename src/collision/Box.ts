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

import Transform from "@math/Transform"
import Vec3, { Vec3Axis } from "@math/Vec3"
import Body from "@dynamics/Body"
import RaycastData from "@common/geometry/RaycastData"
import { FixedArray } from "@containers"
import AABB from "@common/geometry/AABB"
import Mat3 from "@math/Mat3"
import Render from "@common/Render"

export class MassData {
    inertia!: Mat3
    center!: Vec3
    mass!: number
}

export function CreateBox(def: BoxDef, body: Body): Box {
    return new Box(
        def.Tx,
        def.E,
        body,
        def.Friction,
        def.Restitution,
        def.Density,
        def.Sensor
    )
}

export default class Box {
    local!: Transform
    e!: Vec3 // extent, as in the extent of each OBB axis

    body!: Body
    friction!: number
    restitution!: number
    density!: number

    broadPhaseIndex!: number
    userData: any
    sensor!: boolean

    constructor(local: Transform, e: Vec3, body: Body, friction: number, restitution: number, density: number, sensor: boolean) {
        this.local = local
        this.e = e
        this.body = body
        this.friction = friction
        this.restitution = restitution
        this.density = density
        this.sensor = sensor
    }

    TestPoint(tx: Transform, p: Vec3): boolean {
        const world = Transform.Mul(tx, this.local)
        const p0 = Transform.MulTWithVec3(world, p)

        for (var i = 0; i < 3; ++i) {
            const d = p0.Get(i as Vec3Axis)
            const ei = this.e.Get(i as Vec3Axis)

            if (d > ei || d < -ei) {
                return false
            }
        }
        return true
    }
    public Raycast(tx: Transform, raycast: RaycastData): boolean {
        const world = Transform.Mul(tx, this.local);
        const d = Transform.MulTMat3WithVec3(world.rotation, raycast.dir);
        const p = Transform.MulTWithVec3(world, raycast.start);
        const epsilon = 1e-8;
        var tmin = 0;
        var tmax = raycast.t;

        // t = (e[ i ] - p.[ i ]) / d[ i ]
        var t0;
        var t1;
        var n0 = new Vec3();

        for (var i = 0; i < 3; ++i) {
            // Check for ray parallel to and outside of AABB
            if (Math.abs(d.Get(i as Vec3Axis)) < epsilon) {
                // Detect separating axes
                if (p.Get(i as Vec3Axis) < -this.e.Get(i as Vec3Axis) || p.Get(i as Vec3Axis) > this.e.Get(i as Vec3Axis)) {
                    return false;
                }
            }

            else {
                const d0 = 1 / d.Get(i as Vec3Axis);
                const s = Math.sign(d.Get(i as Vec3Axis));
                const ei = this.e.Get(i as Vec3Axis) * s;
                var n = new Vec3(0, 0, 0);
                n.Set(i, -s);

                t0 = -(ei + p.Get(i as Vec3Axis)) * d0;
                t1 = (ei - p.Get(i as Vec3Axis)) * d0;

                if (t0 > tmin) {
                    n0 = n;
                    tmin = t0;
                }

                tmax = Math.min(tmax, t1);

                if (tmin > tmax) {
                    return false;
                }
            }
        }

        raycast.normal = Transform.MulMat3WithVec3(world.rotation, n0);
        raycast.toi = tmin;

        return true;
    }

    static kBoxVertices: FixedArray<8, Vec3> = [
        new Vec3(-1, -1, -1),
        new Vec3(-1, -1, 1),
        new Vec3(-1, 1, -1),
        new Vec3(-1, 1, 1),
        new Vec3(1, -1, -1),
        new Vec3(1, -1, 1),
        new Vec3(1, 1, -1),
        new Vec3(1, 1, 1)
    ]

    public ComputeAABB(tx: Transform, aabb?: AABB): AABB {
        const world = Transform.Mul(tx, this.local);
        var min = new Vec3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
        var max = new Vec3(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

        for (var i = 0; i < 8; ++i) {
            var v = Transform.MulWithVec3(world, Vec3.Mul(Box.kBoxVertices[i], this.e));
            min = Vec3.Min(min, v);
            max = Vec3.Max(max, v);
        }

        if (!aabb) {
            return new AABB(min, max)
        }
        aabb.min = min;
        aabb.max = max;
        return aabb;
    }

    public ComputeMass(md?: MassData): MassData {
        // Calculate inertia tensor
        const ex2 = 4 * this.e.x * this.e.x;
        const ey2 = 4 * this.e.y * this.e.y;
        const ez2 = 4 * this.e.z * this.e.z;
        const mass = 8 * this.e.x * this.e.y * this.e.z * this.density;
        const x = 1 / 12.0 * mass * (ey2 + ez2);
        const y = 1 / 12.0 * mass * (ex2 + ez2);
        const z = 1 / 12.0 * mass * (ex2 + ey2);
        var I = Mat3.Diagonal(x, y, z);

        // Transform tensor to local space
        I = this.local.rotation.Multiply(I).Multiply(Mat3.Transpose(this.local.rotation));
        I.Add(
            Mat3.Identity()
                .MultiplyByNumber(
                    Vec3.Dot(this.local.position, this.local.position))
                .Sub(
                    Mat3.OuterProduct(
                        this.local.position,
                        this.local.position)))
            .MultiplyByNumber(mass)

        if(!md) md = new MassData()
        md.center = this.local.position;
        md.inertia = I;
        md.mass = mass;
        return md
    }


    //--------------------------------------------------------------------------------------------------
    static kBoxIndices: FixedArray<36> = [
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
        2 - 1, 8 - 1, 4 - 1
    ];

    public Render(tx: Transform, _awake: boolean, render: Render): void {
        const world = Transform.Mul(tx, this.local);

        const vertices: FixedArray<8, Vec3> = [
            new Vec3(-this.e.x, -this.e.y, -this.e.z),
            new Vec3(-this.e.x, -this.e.y, this.e.z),
            new Vec3(-this.e.x, this.e.y, -this.e.z),
            new Vec3(-this.e.x, this.e.y, this.e.z),
            new Vec3(this.e.x, -this.e.y, -this.e.z),
            new Vec3(this.e.x, -this.e.y, this.e.z),
            new Vec3(this.e.x, this.e.y, -this.e.z),
            new Vec3(this.e.x, this.e.y, this.e.z)
        ];

        for (var i = 0; i < 36; i += 3) {
            const a = Transform.MulWithVec3(world, vertices[Box.kBoxIndices[i]]);
            const b = Transform.MulWithVec3(world, vertices[Box.kBoxIndices[i + 1]]);
            const c = Transform.MulWithVec3(world, vertices[Box.kBoxIndices[i + 2]]);

            const n = Vec3.Normalize(Vec3.Cross(b.Sub(a), c.Sub(a)));

            //render->SetPenColor( 0.2f, 0.4f, 0.7f, 0.5f );
            //render->SetPenPosition( a.x, a.y, a.z );
            //render->Line( b.x, b.y, b.z );
            //render->Line( c.x, c.y, c.z );
            //render->Line( a.x, a.y, a.z );

            render.SetTriNormal(n.x, n.y, n.z);
            render.Triangle(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
        }
    }
}

export class BoxDef {
    Friction: number
    Restitution: number
    Density: number
    Sensor: boolean
    Tx: Transform
    E: Vec3

    constructor() {
        this.Friction = 0.4
        this.Restitution = 0.2
        this.Density = 1.0
        this.Sensor = false
        this.Tx = Transform.Identity
        this.E = new Vec3(0.5, 0.5, 0.5)
    }

    Set(tx: Transform, extents: Vec3): void {
        this.Tx = tx
        this.E = extents.MultiplyByNumber(0.5)
    }

    public set SetFriction(friction: number) {
        this.Friction = friction
    }
    public set SetRestitution(restitution: number) {
        this.Restitution = restitution
    }
    public set SetDensity(density: number) {
        this.Density = density
    }
    public set SetSensor(sensor: boolean) {
        this.Sensor = sensor
    }
}
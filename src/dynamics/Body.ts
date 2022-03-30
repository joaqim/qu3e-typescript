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

import List from "@collections/List";
import Box, { BoxDef, CreateBox } from "@collision/Box";
import AABB from "@common/geometry/AABB";
import Render from "@common/Render";
import { ContactConstraint, ContactEdge } from "@dynamics";
import Mat3 from "@math/Mat3";
import Quaternion from "@math/Quaternion";
import Transform from "@math/Transform";
import Vec3, { ReadonlyVec3 } from "@math/Vec3";

type Broadphase = {
    RemoveBox: (box: Box) => void
    InsertBox: (box: Box, aabb: AABB) => void
    Update: (index: number, aabb: AABB) => void
}
type ContactManager = {
    Broadphase: Broadphase
    RemoveContactsFromBody: (body: Body) => void
    RemoveContact: (contact: ContactConstraint) => void
}
type Scene = {
    ContactManager: ContactManager
    NewBox: boolean
}

export enum BodyType {
    StaticBody,
    DynamicBody,
    KinematicBody
}

export enum BodyFlags {
    Awake = 0x001,
    Active = 0x002,
    AllowSleep = 0x004,
    Island = 0x010,
    Static = 0x020,
    Dynamic = 0x040,
    Kinematic = 0x080,
    LockAxisX = 0x100,
    LockAxisY = 0x200,
    LockAxisZ = 0x400,
}

export default class Body {

    // Adds a box to this body. Boxes are all defined in local space
    // of their owning body. Boxes cannot be defined relative to one
    // another. The body will recalculate its mass values. No contacts
    // will be created until the next Scene::Step( ) call.
    public AddBox(def: BoxDef): Box {
        var box = CreateBox(def, this)
        this.Boxes.Add(box);
        var aabb = box.ComputeAABB(this.Tx)

        this.CalculateMassData();

        this.Scene.ContactManager.Broadphase.InsertBox(box, aabb);
        this.Scene.NewBox = true;

        return box;
    }
    // Removes this box from the body and broadphase. Forces the body
    // to recompute its mass if the body is dynamic. Frees the memory
    // pointed to by the box pointer.
    RemoveBox(box: Box) {
        Assert(box != null);
        Assert(box.body == this);

        const found = this.Boxes.Remove(box)

        // This shape was not connected to this body.
        Assert(found);

        // Remove all contacts associated with this shape
        this.ContactList.ForEach((edge: ContactEdge) => {
            const contact = edge.constraint;
            //TODO: Make sure contact is always defined here
            Assert(contact != undefined)
            if (box == contact!.A || box == contact!.B)
                this.Scene.ContactManager.RemoveContact(contact!);

        })

        this.Scene.ContactManager.Broadphase.RemoveBox(box);

        this.CalculateMassData();
        // Scene.Heap.Free((void)box);
    }

    // Removes all boxes from this body and the broadphase.
    RemoveAllBoxes(): void {
        this.Boxes.ForEach((box: Box) => this.Scene.ContactManager.Broadphase.RemoveBox(box))

        this.Scene.ContactManager.RemoveContactsFromBody(this);

    }
    ApplyLinearForce(force: ReadonlyVec3): void {
        this.Force.Add(Vec3.Scale(force, this.Mass))

        this.SetToAwake()
    }

    ApplyForceAtWorldPoint(force: ReadonlyVec3, point: ReadonlyVec3): void {
        this.Force.Add(Vec3.Scale(force, this.Mass))
        this.Torque.Add(Vec3.Cross(Vec3.Sub(point, this.WorldCenter), force))

        this.SetToAwake()
    }

    ApplyLinearImpulse(impulse: Vec3): void {
        this.LinearVelocity.Add(Vec3.Scale(impulse, this.InvMass))
        this.SetToAwake()
    }
    ApplyLinearImpulseAtWorldPoint(impulse: Vec3, point: Vec3): void {
        this.LinearVelocity.Add(Vec3.Scale(impulse, this.InvMass))
        this.AngularVelocity.Add(
            Mat3.MultiplyByVec3(
                this.InvInertiaWorld,
                Vec3.Cross(
                    Vec3.Sub(point, this.WorldCenter),
                    impulse)))

        this.SetToAwake()
    }

    ApplyTorque = (torque: ReadonlyVec3): void => { this.Torque.Add(torque) }

    SetToAwake() {
        if ((this.Flags & BodyFlags.Awake) == 0) {
            this.Flags |= BodyFlags.Awake
            this.SleepTime = 0
        }
    }

    SetToSleep() {
        this.Flags &= ~BodyFlags.Awake
        this.SleepTime = 0
        Vec3.Identity(this.LinearVelocity)
        Vec3.Identity(this.AngularVelocity)
        Vec3.Identity(this.Force)
        Vec3.Identity(this.Torque)
    }
    IsAwake = (): boolean => (this.Flags & BodyFlags.Awake) > 0
    GetGravityScale = () => this.GravityScale
    SetGravityScale(scale: number): void { this.GravityScale = scale }

    GetLocalPoint = (v: ReadonlyVec3): Vec3 => Transform.MulTWithVec3(this.Tx, v)
    GetLocalVector = (v: ReadonlyVec3): Vec3 => Transform.MulTMat3WithVec3(this.Tx.rotation, v)
    GetWorldPoint = (p: ReadonlyVec3): Vec3 => Transform.MulWithVec3(this.Tx, p)
    GetWorldVector = (v: ReadonlyVec3): Vec3 => Transform.MulMat3WithVec3(this.Tx.rotation, v)

    GetLinearVelocity = () => this.LinearVelocity

    GetVelocityAtWorldPoint(p: Vec3): Vec3 {
        const directonToPoint = Vec3.Sub(p, this.WorldCenter)
        const relativeAngularVel = Vec3.Cross(this.AngularVelocity, directonToPoint)

        return Vec3.Add(this.LinearVelocity, relativeAngularVel)
    }

    SetLinearVelocity(v: ReadonlyVec3): void {
        // Velocity of static bodies cannot be adjusted
        if ((this.Flags & BodyFlags.Static) > 0)
            Assert(false)

        if (Vec3.Dot(v, v) > 0)
            this.SetToAwake()
        this.LinearVelocity = v
    }
    GetAngularVelocity = () => this.GetAngularVelocity

    SetAngularVelocity(v: ReadonlyVec3): void {
        // Velocity of static bodies cannot be adjusted
        if ((this.Flags & BodyFlags.Static) > 0)
            Assert(false)
        if (Vec3.Dot(v, v) > 0)
            this.SetToAwake()
        this.AngularVelocity = v
    }

    CanCollide(other: Body): boolean {
        if (this == other)
            return false

        // Every collision must have at least one dynamic body involved
        if ((this.Flags & BodyFlags.Dynamic) && (other.Flags & BodyFlags.Dynamic) == 0)
            return false
        if ((this.Layers & other.Layers) == 0)
            return false
        return true
    }

    // Manipulating the transformation of a body manually will result in
    // non-physical behavior. Contacts are updated upon the next call to
    // Scene::Step( ). Parameters are in world space. All body types
    // can be updated.
    SetTransform(position: ReadonlyVec3, axis?: ReadonlyVec3, angle?: number): void {
        this.WorldCenter = position

        if (axis && angle) {
            this.Q.Set(axis, angle)
            this.Tx.rotation = this.Q.ToMat3()
        }

        this.SynchronizeProxies()
    }


    // Used for debug rendering lines, triangles and basic lighting
    Render(render: Render): void {
        const awake = this.IsAwake()

        this.Boxes.ForEach((box: Box) => {
            box.Render(this.Tx, awake, render)
        })
    }

    GetTransform = () => this.Tx
    GetFlags = () => this.Flags
    SetLayers = (layers: number) => this.Layers = layers
    GetLayers = () => this.Layers
    GetQuaternion = () => this.Q
    GetUserData = () => this.UserData
    SetLinearDamping = (damping: number) => this.LinearDamping = damping
    GetLinearDamping = () => this.LinearDamping
    SetAngularDamping = (damping: number) => this.AngularDamping = damping
    GetAngularDamping = () => this.AngularDamping
    GetMass = () => this.Mass
    GetInvMass = () => this.InvMass

    constructor(def: BodyDef, scene: Scene) {
        this.LinearVelocity = def.linearVelocity;
        this.AngularVelocity = def.angularVelocity;
        this.Force = Vec3.Identity()
        this.Torque = Vec3.Identity()
        //TODO: Make sure angle and expected radians is of right type
        this.Q = new Quaternion([Vec3.Normalize(def.axis), def.angle]);

        this.Tx = new Transform(this.Q.ToMat3(), def.position)
        this.SleepTime = 0;
        this.GravityScale = def.gravityScale;
        this.Layers = def.layers;
        this.UserData = def.userData;
        this.Scene = scene;
        this.Flags = 0;
        this.LinearDamping = def.linearDamping;
        this.AngularDamping = def.angularDamping;

        if (def.bodyType == BodyType.DynamicBody) {
            this.Flags |= BodyFlags.Dynamic;
        } else {
            if (def.bodyType == BodyType.StaticBody) {
                this.Flags |= BodyFlags.Static;
                this.LinearVelocity = Vec3.Identity()
                this.AngularVelocity = Vec3.Identity()
                this.Force = Vec3.Identity()
                this.Torque = Vec3.Identity()
            }

            else if (def.bodyType == BodyType.KinematicBody)
                this.Flags |= BodyFlags.Kinematic;
        }

        if (def.allowSleep)
            this.Flags |= BodyFlags.AllowSleep;

        if (def.awake)
            this.Flags |= BodyFlags.Awake;

        if (def.active)
            this.Flags |= BodyFlags.Active;

        if (def.lockAxisX)
            this.Flags |= BodyFlags.LockAxisX;

        if (def.lockAxisY)
            this.Flags |= BodyFlags.LockAxisY;

        if (def.lockAxisZ)
            this.Flags |= BodyFlags.LockAxisZ;

        this.Boxes = new List<Box>();
        this.ContactList = new List<ContactEdge>();
    }


    // TODO: Better defaults
    private InvInertiaModel!: Mat3;
    private InvInertiaWorld!: Mat3;
    private Mass!: number;
    private InvMass!: number;

    private LinearVelocity: Vec3;
    private AngularVelocity: Vec3;
    private Force: Vec3;
    private Torque: Vec3;
    private Tx: Transform;
    private Q: Quaternion

    // TODO: Better defaults
    private LocalCenter!: Vec3;
    private WorldCenter!: Vec3;

    private SleepTime: number;
    private GravityScale: number;
    private Layers: number;
    private Flags: BodyFlags;

    private Boxes: List<Box>;
    private UserData: any;
    private Scene: Scene;
    //private Body Next;
    //private Body Prev;
    private IslandIndex?: number;

    private LinearDamping: number;
    private AngularDamping: number;

    private ContactList: List<ContactEdge>

    CalculateMassData(): void {
        var inertia = Mat3.Diagonal(0);
        this.InvInertiaModel = Mat3.Diagonal(0);
        this.InvInertiaWorld = Mat3.Diagonal(0);
        this.InvMass = 0;
        this.Mass = 0;
        var mass = 0;

        if ((this.Flags & BodyFlags.Static) > 0 || (this.Flags & BodyFlags.Kinematic) > 0) {
            Vec3.Identity(this.LocalCenter);
            this.WorldCenter = this.Tx.position;
            return;
        }

        var lc = Vec3.Identity();

        this.Boxes.ForEach((box: Box) => {
            if (box.density != 0) {
                var md = box.ComputeMass();
                mass += md.mass;
                inertia.Add(md.inertia);
                lc.Add(Vec3.Scale(md.center, md.mass))
            }
        })

        if (mass > 0) {
            this.Mass = mass;
            this.InvMass = 1 / mass;
            lc.Scale(this.InvMass);
            //NOTE: Orders of Operations: inertia -= (((m3Id * dot) - m3product) * mass)
            inertia.Sub(Mat3.Sub(Mat3.Scale(Mat3.Identity(), Vec3.Dot(lc, lc)), Mat3.OuterProduct(lc, lc)).Scale(mass))

            this.InvInertiaModel = Mat3.Inverse(inertia);

            if ((this.Flags & BodyFlags.LockAxisX) > 0)
                Vec3.Identity(this.InvInertiaModel.ex);

            if ((this.Flags & BodyFlags.LockAxisY) > 0)
                Vec3.Identity(this.InvInertiaModel.ey);

            if ((this.Flags & BodyFlags.LockAxisZ) > 0)
                Vec3.Identity(this.InvInertiaModel.ez);
        }
        else {
            // Force all dynamic bodies to have some mass
            this.InvMass = 1;
            this.InvInertiaModel = Mat3.Diagonal(0);
            this.InvInertiaWorld = Mat3.Diagonal(0);
        }

        this.LocalCenter = lc;
        this.WorldCenter = Transform.MulWithVec3(this.Tx, lc);
    }

    private SynchronizeProxies(): void {
        const broadphase = this.Scene.ContactManager.Broadphase;

        this.Tx.position = Vec3.Sub(this.WorldCenter, Transform.MulMat3WithVec3(this.Tx.rotation, this.LocalCenter))

        const tx = this.Tx;
        var aabb = new AABB();

        this.Boxes.ForEach((box: Box) => {
            box.ComputeAABB(tx, aabb);
            broadphase.Update(box.broadPhaseIndex, aabb);
        })
    }
}

export class BodyDef {
    constructor() {
        // Set all initial positions/velocties to zero
        this.axis = Vec3.Identity()
        this.angle = 0;
        this.position = Vec3.Identity()
        this.linearVelocity = Vec3.Identity()
        this.angularVelocity = Vec3.Identity()

        // Usually a gravity scale of 1 is the best
        this.gravityScale = 1;

        // Common default values
        this.bodyType = BodyType.StaticBody;
        this.layers = 0x000000001;
        this.userData = null;
        this.allowSleep = true;
        this.awake = true;
        this.active = true;
        this.lockAxisX = false;
        this.lockAxisY = false;
        this.lockAxisZ = false;

        this.linearDamping = 0;
        this.angularDamping = 0.1;
    }

    public axis: Vec3;            // Initial world transformation.
    public angle: number;              // Initial world transformation. Radians.
    public position: Vec3;        // Initial world transformation.
    public linearVelocity: Vec3;  // Initial linear velocity in world space.
    public angularVelocity: Vec3; // Initial angular velocity in world space.
    public gravityScale: number;       // Convenient scale values for gravity x, y and z directions.
    public layers: number;             // Bitmask of collision layers. Bodies matching at least one layer can collide.
    public userData: any;         // Use to store application specific data.

    public linearDamping: number;
    public angularDamping: number;

    // Static, dynamic or kinematic. Dynamic bodies with zero mass are defaulted
    // to a mass of 1. Static bodies never move or integrate, and are very CPU
    // efficient. Static bodies have infinite mass. Kinematic bodies have
    // infinite mass, but *do* integrate and move around. Kinematic bodies do not
    // resolve any collisions.
    public bodyType: BodyType;

    public allowSleep: boolean;    // Sleeping lets a body assume a non-moving state. Greatly reduces CPU usage.
    public awake: boolean;         // Initial sleep state. True means awake.
    public active: boolean;        // A body can start out inactive and just sits in memory.
    public lockAxisX: boolean;     // Locked rotation on the x axis.
    public lockAxisY: boolean;     // Locked rotation on the y axis.
    public lockAxisZ: boolean;     // Locked rotation on the z axis.
}
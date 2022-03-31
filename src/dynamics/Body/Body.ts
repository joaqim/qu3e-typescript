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

import List from "@collections/List"
import type Box from "@collision/Box"
import type { BoxDefinition } from "@collision/Box"
import { CreateBox } from "@collision/Box"
import { AABB } from "@common"
import type { Render } from "@common/Render"
import type { BodyDefinition } from "@dynamics"
import type ContactEdge from "@dynamics/Contact/ContactEdge"
import type { ReadonlyVec3 } from "@math"
import { Mat3, Quaternion, Transform, Vec3 } from "@math"
import type { Scene } from "@scene/Scene"

// eslint-disable-next-line no-shadow
export enum BodyType {
  StaticBody = 0,
  DynamicBody = 1,
  KinematicBody = 2,
}

// eslint-disable-next-line no-shadow
export enum BodyFlags {
  Awake = 0x0_01,
  Active = 0x0_02,
  AllowSleep = 0x0_04,
  Island = 0x0_10,
  Static = 0x0_20,
  Dynamic = 0x0_40,
  Kinematic = 0x0_80,
  LockAxisX = 0x1_00,
  LockAxisY = 0x2_00,
  LockAxisZ = 0x4_00,
}

export default class Body {
  // Adds a box to this body. Boxes are all defined in local space
  // of their owning body. Boxes cannot be defined relative to one
  // another. The body will recalculate its mass values. No contacts
  // will be created until the next Scene::Step( ) call.
  public AddBox(definition: BoxDefinition): Box {
    const box = CreateBox(definition, this)
    this.Boxes.Add(box)
    const aabb = box.ComputeAABB(this.Tx)

    this.CalculateMassData()

    this.Scene.ContactManager.Broadphase.InsertBox(box, aabb)
    this.Scene.NewBox = true

    return box
  }

  // Removes this box from the body and broadphase. Forces the body
  // to recompute its mass if the body is dynamic. Frees the memory
  // pointed to by the box pointer.
  public RemoveBox(box: Box): void {
    Assert(box !== null)
    Assert(box.body === this)

    const found = this.Boxes.Remove(box)

    // This shape was not connected to this body.
    Assert(found)

    // Remove all contacts associated with this shape
    this.ContactList.ForEach((edge: ContactEdge) => {
      const contact = edge.constraint
      // TODO: Make sure contact is always defined here
      Assert(contact !== undefined)

      if (box === contact!.A || box === contact!.B)
        this.Scene.ContactManager.RemoveContact(contact!)
    })

    this.Scene.ContactManager.Broadphase.RemoveBox(box)

    this.CalculateMassData()
    // Scene.Heap.Free((void)box);
  }

  // Removes all boxes from this body and the broadphase.
  public RemoveAllBoxes(): void {
    this.Boxes.ForEach((box: Box) =>
      this.Scene.ContactManager.Broadphase.RemoveBox(box),
    )

    this.Scene.ContactManager.RemoveContactsFromBody(this)
  }

  public ApplyLinearForce(force: ReadonlyVec3): void {
    this.Force.Add(Vec3.Scale(force, this.Mass))

    this.SetToAwake()
  }

  public ApplyForceAtWorldPoint(
    force: ReadonlyVec3,
    point: ReadonlyVec3,
  ): void {
    this.Force.Add(Vec3.Scale(force, this.Mass))
    this.Torque.Add(Vec3.Cross(Vec3.Sub(point, this.WorldCenter), force))

    this.SetToAwake()
  }

  public ApplyLinearImpulse(impulse: Vec3): void {
    this.LinearVelocity.Add(Vec3.Scale(impulse, this.InvMass))
    this.SetToAwake()
  }

  public ApplyLinearImpulseAtWorldPoint(impulse: Vec3, point: Vec3): void {
    this.LinearVelocity.Add(Vec3.Scale(impulse, this.InvMass))
    this.AngularVelocity.Add(
      Mat3.MultiplyByVec3(
        this.InvInertiaWorld,
        Vec3.Cross(Vec3.Sub(point, this.WorldCenter), impulse),
      ),
    )

    this.SetToAwake()
  }

  public ApplyTorque = (torque: ReadonlyVec3): void => {
    this.Torque.Add(torque)
  }

  public SetToAwake(): void {
    if ((this.Flags & BodyFlags.Awake) === 0) {
      this.Flags |= BodyFlags.Awake
      this.SleepTime = 0
    }
  }

  public SetToSleep(): void {
    this.Flags &= ~BodyFlags.Awake
    this.SleepTime = 0
    Vec3.Identity(this.LinearVelocity)
    Vec3.Identity(this.AngularVelocity)
    Vec3.Identity(this.Force)
    Vec3.Identity(this.Torque)
  }

  public IsAwake = (): boolean => (this.Flags & BodyFlags.Awake) > 0
  public GetGravityScale = (): number => this.GravityScale
  public SetGravityScale(scale: number): void {
    this.GravityScale = scale
  }

  public GetLocalPoint = (v: ReadonlyVec3): Vec3 =>
    Transform.MulTWithVec3(this.Tx, v)

  public GetLocalVector = (v: ReadonlyVec3): Vec3 =>
    Transform.MulTMat3WithVec3(this.Tx.rotation, v)

  public GetWorldPoint = (p: ReadonlyVec3): Vec3 =>
    Transform.MulWithVec3(this.Tx, p)

  public GetWorldVector = (v: ReadonlyVec3): Vec3 =>
    Transform.MulMat3WithVec3(this.Tx.rotation, v)

  public GetLinearVelocity = (): Vec3 => this.LinearVelocity

  public GetVelocityAtWorldPoint(p: Vec3): Vec3 {
    const directonToPoint = Vec3.Sub(p, this.WorldCenter)
    const relativeAngularVel = Vec3.Cross(this.AngularVelocity, directonToPoint)

    return Vec3.Add(this.LinearVelocity, relativeAngularVel)
  }

  public SetLinearVelocity(v: ReadonlyVec3): void {
    // Velocity of static bodies cannot be adjusted
    if ((this.Flags & BodyFlags.Static) > 0) Assert(false)

    if (Vec3.Dot(v, v) > 0) this.SetToAwake()
    this.LinearVelocity = v
  }

  public GetAngularVelocity = (): Vec3 => this.AngularVelocity

  public SetAngularVelocity(v: ReadonlyVec3): void {
    // Velocity of static bodies cannot be adjusted
    if ((this.Flags & BodyFlags.Static) > 0) Assert(false)

    if (Vec3.Dot(v, v) > 0) this.SetToAwake()
    this.AngularVelocity = v
  }

  public CanCollide(other: Body): boolean {
    if (this === other) return false

    // Every collision must have at least one dynamic body involved
    if (
      this.Flags & BodyFlags.Dynamic &&
      (other.Flags & BodyFlags.Dynamic) === 0
    )
      return false

    if ((this.Layers & other.Layers) === 0) return false
    return true
  }

  // Manipulating the transformation of a body manually will result in
  // non-physical behavior. Contacts are updated upon the next call to
  // Scene::Step( ). Parameters are in world space. All body types
  // can be updated.
  public SetTransform(
    position: ReadonlyVec3,
    axis?: ReadonlyVec3,
    angle?: number,
  ): void {
    this.WorldCenter = position

    if (axis && angle) {
      this.Q.Set(axis, angle)
      this.Tx.rotation = this.Q.ToMat3()
    }

    this.SynchronizeProxies()
  }

  // Used for debug rendering lines, triangles and basic lighting
  public Render(render: Render): void {
    const awake = this.IsAwake()

    this.Boxes.ForEach((box: Box) => {
      box.Render(this.Tx, awake, render)
    })
  }

  public GetTransform = (): Transform => this.Tx
  public GetFlags = (): BodyFlags => this.Flags
  public SetLayers(layers: number): void {
    this.Layers = layers
  }

  public GetLayers = (): number => this.Layers
  public GetQuaternion = (): Quaternion => this.Q
  public GetUserData = (): unknown => this.UserData
  public SetLinearDamping(damping: number): void {
    this.LinearDamping = damping
  }

  public GetLinearDamping = (): number => this.LinearDamping
  public SetAngularDamping(damping: number): void {
    this.AngularDamping = damping
  }

  public GetAngularDamping = (): number => this.AngularDamping
  public GetMass = (): number => this.Mass
  public GetInvMass = (): number => this.InvMass

  public constructor(definition: BodyDefinition, scene: Scene) {
    this.LinearVelocity = definition.linearVelocity
    this.AngularVelocity = definition.angularVelocity
    this.Force = Vec3.Identity()
    this.Torque = Vec3.Identity()
    // TODO: Make sure angle and expected radians is of right type
    this.Q = new Quaternion([Vec3.Normalize(definition.axis), definition.angle])

    this.Tx = new Transform(this.Q.ToMat3(), definition.position)
    this.SleepTime = 0
    this.GravityScale = definition.gravityScale
    this.Layers = definition.layers
    this.UserData = definition.userData
    this.Scene = scene
    this.Flags = 0
    this.LinearDamping = definition.linearDamping
    this.AngularDamping = definition.angularDamping

    switch (definition.bodyType) {
      case BodyType.DynamicBody:
        this.Flags |= BodyFlags.Dynamic
        break
      case BodyType.StaticBody:
        this.Flags |= BodyFlags.Static
        this.LinearVelocity = Vec3.Identity()
        this.AngularVelocity = Vec3.Identity()
        this.Force = Vec3.Identity()
        this.Torque = Vec3.Identity()
        break
      case BodyType.KinematicBody:
        this.Flags |= BodyFlags.Kinematic
        break
      default:
        break
    }

    if (definition.allowSleep) this.Flags |= BodyFlags.AllowSleep

    if (definition.awake) this.Flags |= BodyFlags.Awake

    if (definition.active) this.Flags |= BodyFlags.Active

    if (definition.lockAxisX) this.Flags |= BodyFlags.LockAxisX

    if (definition.lockAxisY) this.Flags |= BodyFlags.LockAxisY

    if (definition.lockAxisZ) this.Flags |= BodyFlags.LockAxisZ

    this.Boxes = new List<Box>()
    this.ContactList = new List<ContactEdge>()
  }

  // TODO: Better defaults
  private InvInertiaModel!: Mat3
  private InvInertiaWorld!: Mat3
  private Mass!: number
  private InvMass!: number

  private LinearVelocity: Vec3
  private AngularVelocity: Vec3
  private readonly Force: Vec3
  private readonly Torque: Vec3
  private Tx: Transform
  private readonly Q: Quaternion

  // TODO: Better defaults
  private LocalCenter!: Vec3
  private WorldCenter!: Vec3

  private SleepTime: number
  private GravityScale: number
  private Layers: number
  private Flags: BodyFlags

  private readonly Boxes: List<Box>
  private readonly UserData: unknown
  public Scene: Scene
  // private Body Next;
  // private Body Prev;
  private readonly IslandIndex?: number

  private LinearDamping: number
  private AngularDamping: number

  public ContactList: List<ContactEdge>

  public CalculateMassData(): void {
    const inertia = Mat3.Diagonal(0)
    this.InvInertiaModel = Mat3.Diagonal(0)
    this.InvInertiaWorld = Mat3.Diagonal(0)
    this.InvMass = 0
    this.Mass = 0
    let mass = 0

    if (
      (this.Flags & BodyFlags.Static) > 0 ||
      (this.Flags & BodyFlags.Kinematic) > 0
    ) {
      Vec3.Identity(this.LocalCenter)
      this.WorldCenter = this.Tx.position
      return
    }

    const lc = Vec3.Identity()

    this.Boxes.ForEach((box: Box) => {
      if (box.density !== 0) {
        const md = box.ComputeMass()
        mass += md.mass
        inertia.Add(md.inertia)
        lc.Add(Vec3.Scale(md.center, md.mass))
      }
    })

    if (mass > 0) {
      this.Mass = mass
      this.InvMass = 1 / mass
      lc.Scale(this.InvMass)
      // NOTE: Orders of Operations: inertia -= (((m3Id * dot) - m3product) * mass)
      inertia.Sub(
        Mat3.Sub(
          Mat3.Scale(Mat3.Identity(), Vec3.Dot(lc, lc)),
          Mat3.OuterProduct(lc, lc),
        ).Scale(mass),
      )

      this.InvInertiaModel = Mat3.Inverse(inertia)

      if ((this.Flags & BodyFlags.LockAxisX) > 0)
        Vec3.Identity(this.InvInertiaModel.ex)

      if ((this.Flags & BodyFlags.LockAxisY) > 0)
        Vec3.Identity(this.InvInertiaModel.ey)

      if ((this.Flags & BodyFlags.LockAxisZ) > 0)
        Vec3.Identity(this.InvInertiaModel.ez)
    } else {
      // Force all dynamic bodies to have some mass
      this.InvMass = 1
      this.InvInertiaModel = Mat3.Diagonal(0)
      this.InvInertiaWorld = Mat3.Diagonal(0)
    }

    this.LocalCenter = lc
    this.WorldCenter = Transform.MulWithVec3(this.Tx, lc)
  }

  private SynchronizeProxies(): void {
    const broadphase = this.Scene.ContactManager.Broadphase

    this.Tx.position = Vec3.Sub(
      this.WorldCenter,
      Transform.MulMat3WithVec3(this.Tx.rotation, this.LocalCenter),
    )

    const tx = this.Tx
    const aabb = new AABB()

    this.Boxes.ForEach((box: Box) => {
      box.ComputeAABB(tx, aabb)
      broadphase.Update(box.broadPhaseIndex, aabb)
    })
  }
}

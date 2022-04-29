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

/* eslint-disable max-classes-per-file */
import { VelocityState } from "@dynamics"
import type Island from "@dynamics/Island"
import { Mat3, Vec3 } from "@math"

export class ContactState {
  // TODO: Better defaults
  public ra!: Vec3 // Vector from C.O.M to contact position
  public rb!: Vec3 // Vector from C.O.M to contact position
  public penetration!: number // Depth of penetration from collision
  public normalImpulse!: number // Accumulated normal impulse
  public tangentImpulse!: number // Accumulated friction impulse
  public bitangentImpulse!: number // Accumulated friction impulse
  public bias!: number // Restitution + baumgarte
  public normalMass!: number // Normal constraint mass
  public tangentMass!: number // Tangent constraint mass
  public bitangentMass!: number // Tangent constraint mass

  // ContactState Heap/Memory Pooling implemented from c#
  public static heap: ContactState[] = []

  public static Allocate(): ContactState {
    return this.heap.length === 0
      ? new ContactState()
      : (this.heap.pop() as ContactState)
  }

  public static Free(instance: ContactState): void {
    this.heap.push(instance)
  }
}

export class ContactConstraintState {
  public contacts!: ContactState[]
  public contactCount!: number
  public tangentVectors!: Vec3
  public bitangentVectors!: Vec3
  public normal!: Vec3 // From A to B
  public centerA!: Vec3
  public centerB!: Vec3
  public iA!: Mat3
  public iB!: Mat3
  public mA!: number
  public mB!: number
  public restitution!: number
  public friction!: number
  public indexA!: number
  public indexB!: number

  public static heap: ContactConstraintState[] = []

  public static Allocate(): ContactConstraintState {
    return this.heap.length === 0
      ? new ContactConstraintState()
      : (this.heap.pop() as ContactConstraintState)
  }

  public static Free(instance: ContactConstraintState): void {
    this.heap.push(instance)
  }
}

export default class ContactSolver {
  public island: Island
  public contacts: ContactConstraintState[]
  public velocities: VelocityState[]
  public enableFriction: boolean

  public constructor(island: Island) {
    this.island = island
    this.contacts = island.contactStates
    this.velocities = island.velocities
    this.enableFriction = island.enableFriction
  }

  public Initialize(island: Island): void {
    this.island = island
    this.contacts = island.contactStates
    this.velocities = island.velocities
    this.enableFriction = island.enableFriction
  }

  public Shutdown(): void {
    for (let index = 0; index < this.contacts.length; index += 1) {
      const c = this.contacts[index]
      const cc = this.island.contacts[index]

      for (let subIndex = 0; subIndex < c.contactCount; subIndex += 1) {
        const oc = cc.manifold.contacts[subIndex]
        const cs = c.contacts[subIndex]
        oc.normalImpulse = cs.normalImpulse
        oc.tangentImpulse = cs.tangentImpulse
        oc.bitangentImpulse = cs.bitangentImpulse
      }
    }
  }

  public static Invert(index: number): number {
    return index === 0 ? 0 : 1 / index
  }

  public static Clamp(a: number, b: number, t: number): number {
    if (t < a) return a

    if (t > b) return b
    return t
  }

  public PreSolve(dt: number): void {
    // for (let i = 0; i < this.contacts.length; i+=1) {
    for (const cs of this.contacts) {
      const vA = this.velocities[cs.indexA].angularVelocity
      const wA = this.velocities[cs.indexA].linearVelocity
      const vB = this.velocities[cs.indexB].angularVelocity
      const wB = this.velocities[cs.indexB].linearVelocity

      for (let index = 0; index < cs.contactCount; index += 1) {
        const c = cs.contacts[index]

        // Precalculate JM^-1JT for contact and friction constraints
        const raCn = Vec3.Cross(c.ra, cs.normal)
        const rbCn = Vec3.Cross(c.rb, cs.normal)
        let nm = cs.mA + cs.mB

        nm +=
          Vec3.Dot(raCn, Mat3.MultiplyByVec3(cs.iA, raCn)) +
          Vec3.Dot(rbCn, Mat3.MultiplyByVec3(cs.iB, rbCn))
        c.normalMass = ContactSolver.Invert(nm)

        {
          const raCt = Vec3.Cross(cs.tangentVectors, c.ra)
          const rbCt = Vec3.Cross(cs.tangentVectors, c.rb)
          const tm =
            nm +
            Vec3.Dot(raCt, Mat3.MultiplyByVec3(cs.iA, raCt)) +
            Vec3.Dot(rbCt, Mat3.MultiplyByVec3(cs.iB, rbCt))
          c.tangentMass = ContactSolver.Invert(tm)
        }
        {
          const raCt = Vec3.Cross(cs.bitangentVectors, c.ra)
          const rbCt = Vec3.Cross(cs.bitangentVectors, c.rb)
          const tm =
            nm +
            Vec3.Dot(raCt, Mat3.MultiplyByVec3(cs.iA, raCt)) +
            Vec3.Dot(rbCt, Mat3.MultiplyByVec3(cs.iB, rbCt))
          c.bitangentMass = ContactSolver.Invert(tm)
        }

        // Precalculate bias factor
        c.bias =
          -Q3_BAUMGARTE *
          (1 / dt) *
          Math.min(0, c.penetration + Q3_PENETRATION_SLOP)

        // Warm start contact
        const P = Vec3.Scale(cs.normal, c.normalImpulse)

        if (this.enableFriction) {
          P.Add(Vec3.Scale(cs.tangentVectors, c.tangentImpulse))
          P.Add(Vec3.Scale(cs.bitangentVectors, c.bitangentImpulse))
        }

        // vA -= P * cs.mA;
        vA.Sub(Vec3.Scale(P, cs.mA))

        // wA -= cs.iA * Vec3.Cross(c.ra, P);
        wA.Sub(Mat3.MultiplyByVec3(cs.iA, Vec3.Cross(c.ra, P)))

        // vB += P * cs.mB;
        vB.Add(Vec3.Scale(P, cs.mB))
        // wB += cs.iB * Vec3.Cross(c.rb, P);
        wB.Add(Mat3.MultiplyByVec3(cs.iB, Vec3.Cross(c.rb, P)))

        // Add in restitution bias
        // double dv = Vec3.Dot(vB + Vec3.Cross(wB, c.rb) - vA - Vec3.Cross(wA, c.ra), cs.normal);
        const dv = Vec3.Dot(
          vB.Add(Vec3.Cross(wB, c.rb)).Sub(vA).Sub(Vec3.Cross(wA, c.ra)),
          cs.normal,
        )

        if (dv < -1) c.bias += -cs.restitution * dv
      }

      this.velocities[cs.indexA] = new VelocityState(vA, wA)
      this.velocities[cs.indexB] = new VelocityState(vB, wB)
    }
  }

  public Solve(): void {
    for (const cs of this.contacts) {
      const vA = this.velocities[cs.indexA].angularVelocity
      const wA = this.velocities[cs.indexA].linearVelocity
      const vB = this.velocities[cs.indexB].angularVelocity
      const wB = this.velocities[cs.indexB].linearVelocity

      for (let index = 0; index < cs.contactCount; index += 1) {
        const c = cs.contacts[index]

        // relative velocity at contact
        let dv = Vec3.Add(vB, Vec3.Cross(wB, c.rb))
          .Sub(vA)
          .Sub(Vec3.Cross(wA, c.ra))

        // Friction
        if (this.enableFriction) {
          {
            let lambda = -Vec3.Dot(dv, cs.tangentVectors) * c.tangentMass

            // Calculate frictional impulse
            const maxLambda = cs.friction * c.normalImpulse

            // Clamp frictional impulse
            const oldPT = c.tangentImpulse
            c.tangentImpulse = ContactSolver.Clamp(
              -maxLambda,
              maxLambda,
              oldPT + lambda,
            )
            lambda = c.tangentImpulse - oldPT

            // Apply friction impulse
            const impulse = Vec3.Scale(cs.tangentVectors, lambda)
            vA.Sub(Vec3.Scale(impulse, cs.mA))
            wA.Sub(Mat3.MultiplyByVec3(cs.iA, Vec3.Cross(c.ra, impulse)))

            vB.Add(Vec3.Scale(impulse, cs.mB))
            wB.Add(Mat3.MultiplyByVec3(cs.iB, Vec3.Cross(c.rb, impulse)))
          }
          {
            let lambda = -Vec3.Dot(dv, cs.bitangentVectors) * c.bitangentMass

            // Calculate frictional impulse
            const maxLambda = cs.friction * c.normalImpulse

            // Clamp frictional impulse
            const oldPT = c.bitangentImpulse
            c.bitangentImpulse = ContactSolver.Clamp(
              -maxLambda,
              maxLambda,
              oldPT + lambda,
            )
            lambda = c.bitangentImpulse - oldPT

            // Apply friction impulse
            const impulse = Vec3.Scale(cs.bitangentVectors, lambda)
            vA.Sub(Vec3.Scale(impulse, cs.mA))
            wA.Sub(Mat3.MultiplyByVec3(cs.iA, Vec3.Cross(c.ra, impulse)))

            vB.Add(Vec3.Scale(impulse, cs.mB))
            wB.Add(Mat3.MultiplyByVec3(cs.iB, Vec3.Cross(c.rb, impulse)))
          }
        }

        // Normal
        {
          dv = Vec3.Add(vB, Vec3.Cross(wB, c.rb))
            .Sub(vA)
            .Sub(Vec3.Cross(wA, c.ra))

          // Normal impulse
          const vn = Vec3.Dot(dv, cs.normal)

          // Factor in positional bias to calculate impulse scalar j
          let lambda = c.normalMass * (-vn + c.bias)

          // Clamp impulse
          const temporaryPN = c.normalImpulse
          c.normalImpulse = Math.max(temporaryPN + lambda, 0)
          lambda = c.normalImpulse - temporaryPN

          // Apply impulse
          const impulse = Vec3.Scale(cs.normal, lambda)
          vA.Sub(Vec3.Scale(impulse, cs.mA))
          wA.Sub(Mat3.MultiplyByVec3(cs.iA, Vec3.Cross(c.ra, impulse)))

          vB.Add(Vec3.Scale(impulse, cs.mB))
          wB.Add(Mat3.MultiplyByVec3(cs.iB, Vec3.Cross(c.rb, impulse)))
        }
      }

      this.velocities[cs.indexA] = new VelocityState(vA, wA)
      this.velocities[cs.indexB] = new VelocityState(vB, wB)
    }
  }
}

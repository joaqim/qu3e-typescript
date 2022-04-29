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

import BroadPhase from "../broadphase"
import List from "../collections/List"
import type Box from "../collision/Box"
import { AABB } from "../common"
import { Vec3 } from "../math"
import type { ContactListener } from "../scene/Scene"
import type Body from "./Body"
import { ContactFlags } from "./Contact/Contact"
import ContactConstraint from "./Contact/ContactConstraint"
import type ContactEdge from "./Contact/ContactEdge"

export class ContactManager {
  public Broadphase: BroadPhase
  public ContactList: List<ContactConstraint>
  public ContactListener: ContactListener | null = null

  public constructor() {
    this.Broadphase = new BroadPhase(this)
    this.ContactList = new List<ContactConstraint>()
  }

  // Add a new contact constraint for a pair of objects
  // unless the contact constraint already exists
  public AddContact(a: Box, b: Box): void {
    const bodyA = a.body
    const bodyB = b.body

    if (!bodyA.CanCollide(bodyB)) return
    // Search for existing matching contact
    // Return if found duplicate to avoid duplicate constraints
    // Mark pre-existing duplicates as active
    // foreach(var edge in A.body.ContactList)

    a.body.ContactList.ForEach((edge: ContactEdge) => {
      if (edge.other === bodyB) {
        const shapeA = edge.constraint?.A
        const shapeB = edge.constraint?.B

        // @TODO: Verify this against Box2D; not sure if this is all we need here
        if (a === shapeA && b === shapeB) return
        // TODO: Make sure to exit loop on return
        // see Array.prototype.some()
      }
    })

    // Create new contact
    const contact = new ContactConstraint(
      a,
      b,
      a.body,
      b.body,
      0,
      MixFriction(a, b),
      MixRestitution(a, b),
    )

    contact.manifold.SetPair(a, b)

    this.ContactList.Add(contact)

    // Connect A
    contact.edgeA.constraint = contact
    contact.edgeA.other = bodyB
    bodyA.ContactList.Add(contact.edgeA)

    // Connect B
    contact.edgeB.constraint = contact
    contact.edgeB.other = bodyA
    bodyB.ContactList.Add(contact.edgeB)

    bodyA.SetToAwake()
    bodyB.SetToAwake()
  }

  // Has broadphase find all contacts and call AddContact on the
  // ContactManager for each pair found
  public FindNewContacts(): void {
    this.Broadphase.UpdatePairs()
  }

  // Remove a specific contact
  public RemoveContact(contact: ContactConstraint): void {
    const a = contact.bodyA
    const b = contact.bodyB

    // Remove from a
    a?.ContactList.Remove(contact.edgeA)
    // Remove from b
    b?.ContactList.Remove(contact.edgeB)

    a?.SetToAwake()
    b?.SetToAwake()

    // Remove contact from the manager
    this.ContactList.Remove(contact)
  }

  // Remove all contacts from a body
  public RemoveContactsFromBody(body: Body): void {
    body.ContactList.ForEach((edge: ContactEdge) => {
      // TODO: Can constraint be null here?
      if (edge.constraint) this.RemoveContact(edge.constraint)
    })
  }

  public RemoveFromBroadphase(body: Body): void {
    body.Boxes.ForEach((box: Box) => {
      this.Broadphase.RemoveBox(box)
    })
  }

  public TestCollisions(): void {
    for (let h = 0; h < this.ContactList.Count(); h += 1) {
      const constraint = this.ContactList.GetAt(h)
      const A = constraint?.A
      const B = constraint?.B
      const bodyA = A.body
      const bodyB = B.body

      constraint.flags &= ~ContactFlags.Island

      if (bodyA.IsAwake() && bodyB.IsAwake()) {
        if (bodyA.CanCollide(bodyB)) {
          this.RemoveContact(constraint)
        } else {
          // Check if contact should persist
          // eslint-disable-next-line no-lonely-if
          if (
            !this.Broadphase.TestOverlap(A.broadPhaseIndex, B.broadPhaseIndex)
          ) {
            this.RemoveContact(constraint)
          } else {
            const manifold = constraint.manifold
            const oldManifold = constraint.manifold
            const ot0 = oldManifold.tangentVectors
            const ot1 = oldManifold.bitangentVectors
            constraint.SolveCollision()
            // AABB.ComputeBasis(manifold.normal, ref manifold.tangentVectors, ref manifold.bitangentVectors);
            // TODO: Better assign by reference
            const { b: tangentVectors, c: bitangentVectors } =
              AABB.ComputeBasis(
                manifold.normal,
                manifold.tangentVectors,
                manifold.bitangentVectors,
              )
            manifold.tangentVectors = tangentVectors
            manifold.bitangentVectors = bitangentVectors

            for (let index = 0; index < manifold.contactCount; index += 1) {
              const c = manifold.contacts[index]
              c.tangentImpulse = 0
              c.bitangentImpulse = 0
              c.normalImpulse = 0
              const oldWarmStart = c.warmStarted
              c.warmStarted = 0

              for (
                let index2 = 0;
                index2 < oldManifold.contactCount;
                index2 += 1
              ) {
                const oc = oldManifold.contacts[index2]

                if (c.fp?.key === oc.fp?.key) {
                  c.normalImpulse = oc.normalImpulse

                  // Attempt to re-project old friction solutions
                  const friction = Vec3.Scale(ot0, oc.tangentImpulse).Add(
                    Vec3.Scale(ot1, oc.bitangentImpulse),
                  )
                  c.tangentImpulse = Vec3.Dot(friction, manifold.tangentVectors)
                  c.bitangentImpulse = Vec3.Dot(
                    friction,
                    manifold.bitangentVectors,
                  )
                  // c.warmStarted = Math.max(oldWarmStart, byte(oldWarmStart + 1))
                  c.warmStarted = Math.max(oldWarmStart, oldWarmStart + 1)
                  break
                }
              }
            }
            // TODO:
            /*
      if (this.ContactListener != null) {
        const nowColliding = constraint.flags & ContactFlags.Colliding
        const wasColliding = constraint.flags & ContactFlags.WasColliding

        if (nowColliding > 0 && wasColliding === 0)
          this.ContactListener.BeginContact(constraint)
        else if (nowColliding === 0 && wasColliding > 0)
          this.ContactListener.EndContact(constraint)
      }
      */
          }
        }
      }
    }
  }
}

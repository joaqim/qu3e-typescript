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

import BroadPhase from "@broadphase"
import List from "@collections/List"
import type Box from "@collision/Box"
import { ContactConstraint } from "@dynamics"
import type { ContactListener } from "@scene/Scene"
import type { ContactEdge } from "./Contact"

export class ContactManager {
  public BroadPhase: BroadPhase
  public ContactList: List<ContactConstraint>
  public ContactListener: ContactListener | null = null

  public constructor() {
    this.BroadPhase = new BroadPhase(this)
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
      this.MixFriction(a, b),
      this.MixRestitution(a, b),
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
}

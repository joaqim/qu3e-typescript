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

import Box from "@collision/Box"
import { AABB } from "@common"
import { ContactManager } from "@dynamics/ContactManager"
import {ContactPair} from "./ContactPair"
import DynamicAABBTree from "./DynamicAABBTree"
import type { TreeCallback } from "./DynamicAABBTree/TreeCallback"

export class BroadPhase implements TreeCallback {
  private readonly manager: ContactManager
  private pairBuffer: ContactPair[]
  private moveBuffer: number[]

  private readonly tree: DynamicAABBTree = new DynamicAABBTree()

  // TODO: Better defaults
  private currentIndex!: number

  constructor(manager: ContactManager) {
    this.manager = manager
    this.pairBuffer = new Array<ContactPair>()
    this.moveBuffer = new Array<number>()
  }

  BufferMove(id: number): void {
    this.moveBuffer.push(id)
  }

  InsertBox(shape: Box, aabb: AABB): void {
    const id = this.tree.Insert(aabb, shape)
    shape.broadPhaseIndex = id
    this.BufferMove(id)
  }

  RemoveBox(shape: Box): void {
    this.tree.Remove(shape.broadPhaseIndex)
  }

  // Generates the contact list. All previous contacts are returned to the allocator
  // before generation occurs.
  UpdatePairs(): void {
    this.pairBuffer = []

    // Query the tree with all moving boxs
    for (var index = 0; index < this.moveBuffer.length; ++index) {
      this.currentIndex = this.moveBuffer[index]
      const aabb = this.tree.GetFatAABB(this.currentIndex)

      // @TODO: Use a static and non-static tree and query one against the other.
      //        This will potentially prevent (gotta think about this more) time
      //        wasted with queries of static bodies against static bodies, and
      //        kinematic to kinematic.
      // this.tree.Query(this, aabb);
    }

    // Reset the move buffer
    // MoveBuffer.Clear();
    this.moveBuffer = []

    // Sort pairs to expose duplicates
    // PairBuffer.Sort(ContactPairSorter.Default);
    // this.pairBuffer.sort(ContactPairSorter.Default)

    // Queue manifolds for solving
    {
      var index = 0

      while (index < this.pairBuffer.length) {
        // Add contact to manager
        const pair = this.pairBuffer[index]
        // TODO: Can pair.A/B ever be undefined here?
        Assert(pair.A != undefined && pair.B != undefined)
        const A = <Box>this.tree.GetUserData(pair.A!)
        const B = <Box>this.tree.GetUserData(pair.B!)
        // this.manager.AddContact(A, B);

        ++index

        // Skip duplicate pairs by iterating i until we find a unique pair
        while (index < this.pairBuffer.length) {
          const potentialDup = this.pairBuffer[index]

          if (pair.A != potentialDup.A || pair.B != potentialDup.B) break
          ++index
        }
      }
    }

    //            Tree.Validate();
  }

  Callback(index: number): boolean {
    if (index == this.currentIndex) return true
    const indexA = Math.min(index, this.currentIndex)
    const indexB = Math.max(index, this.currentIndex)

    this.pairBuffer.push(new ContactPair(indexA, indexB))

    return true
  }
}

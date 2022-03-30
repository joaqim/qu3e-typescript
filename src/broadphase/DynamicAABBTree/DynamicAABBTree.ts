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

import AABB from "@common/geometry/AABB";
import type RaycastData from "@common/geometry/RaycastData";
import type Render from "@common/Render";
import { FixedArray } from "@containers";
import Vec3 from "@math/Vec3";
import type { TreeCallback } from "../TreeCallback";
import { Node } from "./Node";

export default class DynamicAABBTree {
  public root: number;
  public capacity: number; // Max capacity of nodes
  public nodes: Node[];
  public count: number; // Number of active nodes

  public freeList!: number;

  public constructor() {
    this.root = Node.Null;

    this.capacity = 1024;
    this.count = 0;
    this.nodes = Array.from({ length: this.capacity });

    this.AddToFreeList(0);
  }

  // Provide tight-AABB
  public Insert(aabb: AABB, userData: unknown): number {
    const id = this.AllocateNode();

    // Fatten AABB and set height/userdata
    this.nodes[id].aabb = aabb;
    DynamicAABBTree.FattenAABB(this.nodes[id].aabb);
    this.nodes[id].userData = userData;
    this.nodes[id].height = 0;

    this.InsertLeaf(id);

    return id;
  }

  public Remove(id: number): void {
    Assert(id >= 0 && id < this.capacity);
    Assert(this.nodes[id].IsLeaf());

    this.RemoveLeaf(id);
    this.DeallocateNode(id);
  }

  public Update(id: number, aabb: AABB): boolean {
    Assert(id >= 0 && id < this.capacity);
    Assert(this.nodes[id].IsLeaf());

    // TODO: check if this works
    if (this.nodes[id].aabb.Contains(aabb)) return false;

    this.RemoveLeaf(id);

    this.nodes[id].aabb = aabb;
    DynamicAABBTree.FattenAABB(this.nodes[id].aabb);

    this.InsertLeaf(id);

    return true;
  }

  public GetUserData(id: number): unknown {
    Assert(id >= 0 && id < this.capacity);

    return this.nodes[id].userData;
  }

  public GetFatAABB(id: number): AABB {
    Assert(id >= 0 && id < this.capacity);

    return this.nodes[id].aabb;
  }

  public Render(render: Render): void {
    if (this.root !== Node.Null) {
      render.SetPenColor(0.5, 0.5, 1);
      this.RenderNode(render, this.root);
    }
  }

  private stack: number[] = Array.from({ length: 1024 });

  public QueryAABB(callback: TreeCallback, aabb: AABB): void {
    let sp = 1;

    this.stack[0] = this.root;

    while (sp > 0) {
      sp -= 1;
      const id = this.stack[sp];

      const n = this.nodes[id];

      if (AABB.AABBtoAABB(aabb, n.aabb)) {
        if (n.IsLeaf()) {
          if (!callback.Callback(id)) return;
        } else {
          this.stack[sp] = n.left;
          this.stack[sp + 1] = n.right;
          sp += 2;
        }
      }
    }
  }

  public QueryRaycast(callback: TreeCallback, rayCast: RaycastData): void {
    const epsilon = 1e-6;
    const stackCapacity = 256;
    const stack: number[] = Array.from({ length: stackCapacity });
    let sp = 1;

    stack[0] = this.root;

    const p0 = rayCast.start;
    const p1 = p0.Add(rayCast.dir.MultiplyByNumber(rayCast.t));

    while (sp > 0) {
      // stackCapacity too small
      Assert(sp < stackCapacity);

      sp -= 1;
      const id = stack[sp];

      if (id !== Node.Null) {
        const n = this.nodes[id];

        // NOTE: renamed var e -> extent, not sure if that is correct
        const extent = n.aabb.max.Sub(n.aabb.min);
        const d = p1.Sub(p0);
        // var m = p0 + p1 - n.aabb.min - n.aabb.max
        // Order of Operations: ((p0 + p1) - n.aabb.min) - n.aaab.max
        const m = p0.Add(p1).Sub(n.aabb.min).Sub(n.aabb.max);

        let adx = Math.abs(d.x);

        // NOTE: Reformatted control flow, might be broken

        if (Math.abs(m.x) < extent.x - adx) {
          ady = Math.abs(d.y);
        }

        if (Math.abs(m.y) > extent.y + ady) {
          adz = Math.abs(d.z);
        }

        if (Math.abs(m.z) < extent.z + adz) {
          adx += epsilon;
          ady += epsilon;
          adz += epsilon;
        }

        if (Math.abs(m.y * d.z - m.z * d.y) > extent.y * adz + extent.z * ady)
          continue;

        if (Math.abs(m.z * d.x - m.x * d.z) > extent.x * adz + extent.z * adx)
          continue;

        if (Math.abs(m.x * d.y - m.y * d.x) > extent.x * ady + extent.y * adx)
          continue;

        if (n.IsLeaf()) {
          if (!callback.Callback(id)) return;
        } else {
          stack[sp++] = n.left;
          stack[sp++] = n.right;
        }
      }
    }
  }

  // For testing
  public Validate() {
    // Verify free list
    var freeNodes = 0;
    var index = this.freeList;

    while (index != Node.Null) {
      Assert(index >= 0 && index < this.capacity);
      index = this.nodes[index].next;
      ++freeNodes;
    }

    Assert(this.count + freeNodes == this.capacity);

    // Validate tree structure
    if (this.root != Node.Null) {
      Assert(this.nodes[this.root].parent == Node.Null);
      /*
            #if _DEBUG
            ValidateStructure(this.root);
            #endif
            */
    }
  }

  ResizeNodes(source: Node[], length: number) {
    while (length > source.length) source.push();
    source.length = length;
  }

  AllocateNode(): number {
    if (this.freeList == Node.Null) {
      this.capacity *= 2;
      this.ResizeNodes(this.nodes, this.capacity);
      //var newNodes = new Array<Node>(this.capacity)
      //copyWithin(this.nodes, newNodes, this.Count)
      this.AddToFreeList(this.count);
    }

    const freeNode = this.freeList;
    this.freeList = this.nodes[this.freeList].next;
    this.nodes[freeNode].height = 0;
    this.nodes[freeNode].left = Node.Null;
    this.nodes[freeNode].right = Node.Null;
    this.nodes[freeNode].parent = Node.Null;
    this.nodes[freeNode].userData = null;
    this.count += 1;
    return freeNode;
  }

  DeallocateNode(index: number): void {
    Assert(index >= 0 && index < this.capacity);

    this.nodes[index].next = this.freeList;
    this.nodes[index].height = Node.Null;
    this.freeList = index;

    this.count -= 1;
  }

  Balance(iA: number): number {
    var A = this.nodes[iA];

    if (A.IsLeaf() || A.height == 1) return iA;

    /*      A
              /   \
             B     C
            / \   / \
           D   E F   G
        */

    var iB = A.left;
    var iC = A.right;
    var B = this.nodes[iB];
    var C = this.nodes[iC];

    var balance = C.height - B.height;

    // C is higher, promote C
    if (balance > 1) {
      var iF = C.left;
      var iG = C.right;
      var F = this.nodes[iF];
      var G = this.nodes[iG];

      // grandParent point to C
      if (A.parent != Node.Null) {
        if (this.nodes[A.parent].left == iA) this.nodes[A.parent].left = iC;
        else this.nodes[A.parent].right = iC;
      } else this.root = iC;

      // Swap A and C
      C.left = iA;
      C.parent = A.parent;
      A.parent = iC;

      // Finish rotation
      if (F.height > G.height) {
        C.right = iF;
        A.right = iG;
        G.parent = iA;
        A.aabb = AABB.Combine(B.aabb, G.aabb);
        C.aabb = AABB.Combine(A.aabb, F.aabb);

        A.height = 1 + Math.max(B.height, G.height);
        C.height = 1 + Math.max(A.height, F.height);
      } else {
        C.right = iG;
        A.right = iF;
        F.parent = iA;
        A.aabb = AABB.Combine(B.aabb, F.aabb);
        C.aabb = AABB.Combine(A.aabb, G.aabb);

        A.height = 1 + Math.max(B.height, F.height);
        C.height = 1 + Math.max(A.height, G.height);
      }

      return iC;
    }

    // B is higher, promote B
    else if (balance < -1) {
      var iD = B.left;
      var iE = B.right;
      var D = this.nodes[iD];
      var E = this.nodes[iE];

      // grandParent point to B
      if (A.parent != Node.Null) {
        if (this.nodes[A.parent].left == iA) this.nodes[A.parent].left = iB;
        else this.nodes[A.parent].right = iB;
      } else this.root = iB;

      // Swap A and B
      B.right = iA;
      B.parent = A.parent;
      A.parent = iB;

      // Finish rotation
      if (D.height > E.height) {
        B.left = iD;
        A.left = iE;
        E.parent = iA;
        A.aabb = AABB.Combine(C.aabb, E.aabb);
        B.aabb = AABB.Combine(A.aabb, D.aabb);

        A.height = 1 + Math.max(C.height, E.height);
        B.height = 1 + Math.max(A.height, D.height);
      } else {
        B.left = iE;
        A.left = iD;
        D.parent = iA;
        A.aabb = AABB.Combine(C.aabb, D.aabb);
        B.aabb = AABB.Combine(A.aabb, E.aabb);

        A.height = 1 + Math.max(C.height, D.height);
        B.height = 1 + Math.max(A.height, E.height);
      }

      return iB;
    }

    return iA;
  }

  InsertLeaf(id: number) {
    if (this.root == Node.Null) {
      this.root = id;
      this.nodes[this.root].parent = Node.Null;
      return;
    }

    // Search for sibling
    var searchIndex = this.root;
    var leafAABB = this.nodes[id].aabb;
    while (!this.nodes[searchIndex].IsLeaf()) {
      // Cost for insertion at index (branch node), involves creation
      // of new branch to contain this index and the new leaf
      var combined = AABB.Combine(leafAABB, this.nodes[searchIndex].aabb);
      var combinedArea = combined.SurfaceArea();
      var branchCost = 2 * combinedArea;

      // Inherited cost (surface area growth from heirarchy update after descent)
      var inheritedCost =
        2 * (combinedArea - this.nodes[searchIndex].aabb.SurfaceArea());

      var left = this.nodes[searchIndex].left;
      var right = this.nodes[searchIndex].right;

      // Calculate costs for left/right descents. If traversal is to a leaf,
      // then the cost of the combind AABB represents a new branch node. Otherwise
      // the cost is only the inflation of the pre-existing branch.
      var leftDescentCost;
      if (this.nodes[left].IsLeaf())
        leftDescentCost =
          AABB.Combine(leafAABB, this.nodes[left].aabb).SurfaceArea() +
          inheritedCost;
      else {
        var inflated = AABB.Combine(
          leafAABB,
          this.nodes[left].aabb
        ).SurfaceArea();
        var branchArea = this.nodes[left].aabb.SurfaceArea();
        leftDescentCost = inflated - branchArea + inheritedCost;
      }

      // Cost for right descent
      var rightDescentCost;
      if (this.nodes[right].IsLeaf())
        rightDescentCost =
          AABB.Combine(leafAABB, this.nodes[right].aabb).SurfaceArea() +
          inheritedCost;
      else {
        var inflated = AABB.Combine(
          leafAABB,
          this.nodes[right].aabb
        ).SurfaceArea();
        var branchArea = this.nodes[right].aabb.SurfaceArea();
        rightDescentCost = inflated - branchArea + inheritedCost;
      }

      // Determine traversal direction, or early out on a branch index
      if (branchCost < leftDescentCost && branchCost < rightDescentCost) break;

      if (leftDescentCost < rightDescentCost) searchIndex = left;
      else searchIndex = right;
    }

    var sibling = searchIndex;

    // Create new parent
    var oldParent = this.nodes[sibling].parent;
    var newParent = this.AllocateNode();
    this.nodes[newParent].parent = oldParent;
    this.nodes[newParent].userData = null;
    this.nodes[newParent].aabb = AABB.Combine(
      leafAABB,
      this.nodes[sibling].aabb
    );
    this.nodes[newParent].height = this.nodes[sibling].height + 1;

    // Sibling was root
    if (oldParent == Node.Null) {
      this.nodes[newParent].left = sibling;
      this.nodes[newParent].right = id;
      this.nodes[sibling].parent = newParent;
      this.nodes[id].parent = newParent;
      this.root = newParent;
    } else {
      if (this.nodes[oldParent].left == sibling)
        this.nodes[oldParent].left = newParent;
      else this.nodes[oldParent].right = newParent;

      this.nodes[newParent].left = sibling;
      this.nodes[newParent].right = id;
      this.nodes[sibling].parent = newParent;
      this.nodes[id].parent = newParent;
    }

    this.SyncHeirarchy(this.nodes[id].parent);
  }

  RemoveLeaf(id: number) {
    if (id == this.root) {
      this.root = Node.Null;
      return;
    }

    // Setup parent, grandParent and sibling
    var parent = this.nodes[id].parent;
    var grandParent = this.nodes[parent].parent;
    var sibling;

    if (this.nodes[parent].left == id) sibling = this.nodes[parent].right;
    else sibling = this.nodes[parent].left;

    // Remove parent and replace with sibling
    if (grandParent != Node.Null) {
      // Connect grandParent to sibling
      if (this.nodes[grandParent].left == parent)
        this.nodes[grandParent].left = sibling;
      else this.nodes[grandParent].right = sibling;

      // Connect sibling to grandParent
      this.nodes[sibling].parent = grandParent;
    }

    // Parent was root
    else {
      this.root = sibling;
      this.nodes[sibling].parent = Node.Null;
    }

    this.DeallocateNode(parent);
    this.SyncHeirarchy(grandParent);
  }

  ValidateStructure(index: number) {
    var n = this.nodes[index];

    var il = n.left;
    var ir = n.right;

    if (n.IsLeaf()) {
      Assert(ir == Node.Null);
      Assert(n.height == 0);
      return;
    }

    Assert(il >= 0 && il < this.capacity);
    Assert(ir >= 0 && ir < this.capacity);
    var l = this.nodes[il];
    var r = this.nodes[ir];

    Assert(l.parent == index);
    Assert(r.parent == index);

    this.ValidateStructure(il);
    this.ValidateStructure(ir);
  }
  RenderNode(render: Render, index: number) {
    Assert(index >= 0 && index < this.capacity);

    var n = this.nodes[index];
    const b = n.aabb;

    render.SetPenPosition(b.min.x, b.max.y, b.min.z);

    render.Line(b.min.x, b.max.y, b.max.z);
    render.Line(b.max.x, b.max.y, b.max.z);
    render.Line(b.max.x, b.max.y, b.min.z);
    render.Line(b.min.x, b.max.y, b.min.z);

    render.SetPenPosition(b.min.x, b.min.y, b.min.z);

    render.Line(b.min.x, b.min.y, b.max.z);
    render.Line(b.max.x, b.min.y, b.max.z);
    render.Line(b.max.x, b.min.y, b.min.z);
    render.Line(b.min.x, b.min.y, b.min.z);

    render.SetPenPosition(b.min.x, b.min.y, b.min.z);
    render.Line(b.min.x, b.max.y, b.min.z);
    render.SetPenPosition(b.max.x, b.min.y, b.min.z);
    render.Line(b.max.x, b.max.y, b.min.z);
    render.SetPenPosition(b.max.x, b.min.y, b.max.z);
    render.Line(b.max.x, b.max.y, b.max.z);
    render.SetPenPosition(b.min.x, b.min.y, b.max.z);
    render.Line(b.min.x, b.max.y, b.max.z);

    if (!n.IsLeaf()) {
      this.RenderNode(render, n.left);
      this.RenderNode(render, n.right);
    }
  }

  // Correct AABB hierarchy heights and AABBs starting at supplied
  // index traversing up the heirarchy
  SyncHeirarchy(index: number) {
    while (index != Node.Null) {
      index = this.Balance(index);

      var left = this.nodes[index].left;
      var right = this.nodes[index].right;

      this.nodes[index].height =
        1 + Math.max(this.nodes[left].height, this.nodes[right].height);
      this.nodes[index].aabb = AABB.Combine(
        this.nodes[left].aabb,
        this.nodes[right].aabb
      );

      index = this.nodes[index].parent;
    }
  }

  // Insert nodes at a given index until Capacity into the free list
  AddToFreeList(index: number): void {
    for (var i = index; i < this.capacity - 1; ++i) {
      this.nodes[i] = new Node();
      this.nodes[i].next = i + 1;
      this.nodes[i].height = Node.Null;
    }

    this.nodes[this.capacity - 1] = new Node();
    this.nodes[this.capacity - 1].next = Node.Null;
    this.nodes[this.capacity - 1].height = Node.Null;
    this.freeList = index;
  }

  //TODO Make sure aabb is based by reference
  public static FattenAABB(aabb: AABB): void {
    const k_fattener = 0.5;
    const v = new Vec3(k_fattener, k_fattener, k_fattener);

    aabb.min.Sub(v);
    aabb.max.Add(v);
  }
}
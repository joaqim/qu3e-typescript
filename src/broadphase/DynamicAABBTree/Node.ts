import type AABB from "@common/geometry/AABB";

export class Node {
  // Fat AABB for leafs, bounding AABB for branches
  public aabb!: AABB;
  public parent!: number;
  public next!: number;

  // Child indices
  public left!: number;
  public right!: number;

  public userData: unknown;

  // leaf = 0, free nodes = -1
  public height!: number;

  public static readonly Null = -1;

  public IsLeaf = (): boolean => this.right === Node.Null;
}

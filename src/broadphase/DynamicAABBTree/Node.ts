import AABB from "@common/geometry/AABB";

export class Node {
    // Fat AABB for leafs, bounding AABB for branches
    aabb!: AABB;
    parent!: number;
    next!: number;

    // Child indices
    left!: number;
    right!: number;

    userData: any;

    // leaf = 0, free nodes = -1
    height!: number;

    static readonly Null = -1;

    IsLeaf = (): boolean => this.right == Node.Null;
}

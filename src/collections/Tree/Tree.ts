import { TreeNode } from "./TreeNode"

// https://ricardoborges.dev/data-structures-in-typescript-binary-search-tree

export default class Tree<T> {
  public root?: TreeNode<T>

  public comparator: (a: T, b: T) => number

  public constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator
  }

  public insert(data: T): TreeNode<T> | undefined {
    if (!this.root) {
      this.root = new TreeNode(data)
      return this.root
    }

    let current = this.root

    for (;;) {
      if (this.comparator(data, current.data) === 1) {
        if (current.rightNode) {
          current = current.rightNode
        } else {
          current.rightNode = new TreeNode(data)
          return current.rightNode
        }
      } else if (current.leftNode) {
        current = current.leftNode
      } else {
        current.leftNode = new TreeNode(data)
        return current.leftNode
      }
    }
  }

  public search(data: T): TreeNode<T> | undefined {
    if (!this.root) return undefined

    let current = this.root

    while (this.comparator(data, current.data) !== 0) {
      if (this.comparator(data, current.data) === 1) {
        if (!current.rightNode) return undefined

        current = current.rightNode
      } else {
        if (!current.leftNode) return undefined

        current = current.leftNode
      }
    }

    return current
  }
}

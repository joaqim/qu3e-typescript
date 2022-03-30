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

import TreeNode from "./TreeNode";

// https://ricardoborges.dev/data-structures-in-typescript-binary-search-tree

export default class Tree<T> {
  public root?: TreeNode<T>;

  public comparator: (a: T, b: T) => number;

  public constructor(comparator: (a: T, b: T) => number) {
    this.comparator = comparator;
  }

  public insert(data: T): TreeNode<T> | undefined {
    if (!this.root) {
      this.root = new TreeNode(data);
      return this.root;
    }

    let current = this.root;

    for (;;) {
      if (this.comparator(data, current.data) === 1) {
        if (current.rightNode) {
          current = current.rightNode;
        } else {
          current.rightNode = new TreeNode(data);
          return current.rightNode;
        }
      } else if (current.leftNode) {
        current = current.leftNode;
      } else {
        current.leftNode = new TreeNode(data);
        return current.leftNode;
      }
    }
  }

  public search(data: T): TreeNode<T> | undefined {
    if (!this.root) return undefined;

    let current = this.root;

    while (this.comparator(data, current.data) !== 0) {
      if (this.comparator(data, current.data) === 1) {
        if (!current.rightNode) return undefined;

        current = current.rightNode;
      } else {
        if (!current.leftNode) return undefined;

        current = current.leftNode;
      }
    }

    return current;
  }
}

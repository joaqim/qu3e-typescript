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

import Box from "@collision/Box";
import AABB from "@common/geometry/AABB";

export class ContactPair {
    A?: number
    B?: number
}

export interface TreeCallback {
    Callback: (id: number) => boolean
}

class ContactManager {

}

// https://ricardoborges.dev/data-structures-in-typescript-binary-search-tree

class TreeNode<T> {
    data: T
    leftNode?: TreeNode<T>
    rightNode?: TreeNode<T>

    constructor(data: T) {
        this.data = data
    }
}

class Tree<T> {
    root?: TreeNode<T>
    comparator: (a: T, b: T) => number

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator
    }

    insert(data: T): TreeNode<T> | undefined {
        if (!this.root) {
            this.root = new TreeNode(data);
            return this.root;
        }

        let current = this.root;

        while (true) {
            if (this.comparator(data, current.data) === 1) {
                if (current.rightNode) {
                    current = current.rightNode;
                } else {
                    current.rightNode = new TreeNode(data);
                    return current.rightNode;
                }
            } else {
                if (current.leftNode) {
                    current = current.leftNode;
                } else {
                    current.leftNode = new TreeNode(data);
                    return current.leftNode;
                }
            }
        }
    }

    search(data: T): TreeNode<T> | undefined {
        if (!this.root) return undefined;

        let current = this.root;

        while (this.comparator(data, current.data) !== 0) {
            if (this.comparator(data, current.data) === 1) {
                if (!current.rightNode) return;

                current = current.rightNode;
            } else {
                if (!current.leftNode) return;

                current = current.leftNode;
            }
        }

        return current;
    }
}

export default class BroadPhase implements TreeCallback {
    manager: ContactManager;
    pairBuffer: ContactPair[];
    moveBuffer: number[];

    constructor(manager: ContactManager) {
        this.manager = manager;
        this.pairBuffer = new Array<ContactPair>();
        this.moveBuffer = new Array<number>();
    }

    InsertBox(shape: Box, aabb: AABB): void {
        //const id = Tree.insert(aabb, shape)
    }

    Callback(id: number): boolean {
        return true
    }
}
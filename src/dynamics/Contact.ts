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
import { FixedArray } from "@containers"
import Vec3 from "@math/Vec3"
import Body from "./Body"

export class FeaturePair {
    inI?: number
    inR?: number
    outI?: number
    outR?: number
    key?: number
}

export class Contact {
    position?: Vec3;              // World coordinate of contact
    penetration?: number;         // Depth of penetration from collision
    normalImpulse?: number;       // Accumulated normal impulse
    tangentImpulse?: number;      // Accumulated friction impulse
    bitangentImpulse?: number;    // Accumulated friction impulse
    bias?: number;                // Restitution + baumgarte
    normalMass?: number;          // Normal constraint mass
    tangentMass?: number;         // Tangent constraint mass
    bitangentMass?: number;       // Tangent constraint mass
    fp?: FeaturePair;             // Features on A and B for this contact
    warmStarted?: number;         // Used for debug rendering
}

export class Manifold {
    A?: Box
    B?: Box

    normal?: Vec3 // From A to B
    tangentVectors?: Vec3
    bitangentVectors?: Vec3

    contacts!: FixedArray<8, Contact>
    contactCount?: number

    next?: Manifold
    prev?: Manifold

    sensor?: boolean

    constructor() {
        for (var i = 0; i < 8; i++) {
            this.contacts[i] = new Contact();
        }
    }
}

export class ContactEdge {
    other?: Body
    constraint?: ContactConstraint
}

export class ContactConstraint {
    A?: Box
    B?: Box

    edgeA: ContactEdge
    edgeB: ContactEdge

    friction?: number
    restitution?: number

    manifold: Manifold
    flags?: ContactFlags

    constructor() {
        this.manifold = new Manifold()
        this.edgeA = new ContactEdge()
        this.edgeB = new ContactEdge()
    }
}

export enum ContactFlags {
    eColliding = 0x00000001, // Set when contact collides during a step
    eWasColliding = 0x00000002, // Set when two objects stop colliding
    eIsland = 0x00000004, // For internal marking during island forming
}


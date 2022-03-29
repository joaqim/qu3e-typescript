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

export default abstract class Render {
    abstract SetPenColor: (r: number, g: number, b: number, a?: number) => void
    abstract SetPenPosition: (x: number, y: number, z: number) => void
    abstract SetScale: (sx: number, sy: number, sz: number) => void

    // Render a line from pen position to this point.
    // Sets the pen position to the new point.
    abstract Line: (x: number, y: number, z: number) => void

    abstract SetTriNormal: (x: number, y: number, z: number) => void

    // Render a triangle with the normal set by SetTriNormal.
    abstract Triangle: (
        x1: number, y1: number, z1: number,
        x2: number, y2: number, z2: number,
        x3: number, y3: number, z3: number) => void

    // Draw a point with the scale from SetScale
    abstract Point: () => void
}
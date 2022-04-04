/**
 * Copyright (c) 2012, 2018 Matthias Ferch
 * 
 * Project homepage: https://github.com/matthiasferch/tsm
 * 
 * This software is provided 'as-is', without any express or implied warranty.
 * In no event will the authors be held liable for any damages arising from the use of this software.
 * 
 * Permission is granted to anyone to use this software for any purpose, including commercial applications,
 * and to alter it and redistribute it freely, subject to the following restrictions:
 * 
 * The origin of this software must not be misrepresented; you must not claim that you wrote the original software.
 * If you use this software in a product, an acknowledgment in the product documentation would be appreciated but is not required.
 * 
 * Altered source versions must be plainly marked as such, and must not be misrepresented as being the original software.
 * 
 * This notice may not be removed or altered from any source distribution.
 */
import { expect } from "chai"
import {Mat3} from "../src/math"

describe('mat3', () => {
  it('transposes', () => {
    var matrix = new Mat3([
      1.0, 2.0, 3.0,
      4.0, 5.0, 6.0,
      7.0, 8.0, 9.0,
    ])

    matrix = Mat3.Transpose(matrix)

    expect(matrix.Get(0)).to.equal(1.0)
    expect(matrix.Get(1)).to.equal(4.0)
    expect(matrix.Get(2)).to.equal(7.0)

    expect(matrix.Get(3)).to.equal(2.0)
    expect(matrix.Get(4)).to.equal(5.0)
    expect(matrix.Get(5)).to.equal(8.0)

    expect(matrix.Get(6)).to.equal(3.0)
    expect(matrix.Get(7)).to.equal(6.0)
    expect(matrix.Get(8)).to.equal(9.0)

  })

  it('multiplies', () => {
    var matrix = new Mat3([
      1, 2, 3,
      1, 2, 3,
      1, 2, 3
    ])

    matrix.MultiplyByNumber(30);

    expect(matrix.Get(0)).to.equal(30)
    expect(matrix.Get(1)).to.equal(60)
    expect(matrix.Get(2)).to.equal(90)
  })
})
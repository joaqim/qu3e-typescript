import { expect } from "chai"
import Mat3 from "../src/math/Mat3"

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
import { expect } from 'chai'
import { epsilon } from '../src/constants'
import Vec3, { ReadonlyVec3 } from '../src/math/Vec3'

describe('Vec3', () => {

  it('resets', () => {
    var vector = new Vec3(1.0, 2.0, 3.0)

    Vec3.Zero(vector)

    expect(vector.x).to.equal(0)
    expect(vector.y).to.equal(0)
    expect(vector.z).to.equal(0)
  })

  it('copies', () => {
    const vector1: ReadonlyVec3 = new Vec3(1.0, 2.0, 3.0)
    var vector2 = new Vec3(0, 0, 0)

    Vec3.Copy(vector2, vector1)

    expect(vector2.x).to.equal(vector1.x)
    expect(vector2.y).to.equal(vector1.y)
    expect(vector2.z).to.equal(vector1.z)
  })

  /*
  it('negates', () => {
    const vector = new vec3([1.0, 2.0, 3.0])

    vector.negate()

    expect(vector.x).to.equal(-1.0)
    expect(vector.y).to.equal(-2.0)
    expect(vector.z).to.equal(-3.0)
  })

  it('compares', () => {
    const vector1 = new vec3([1.0, 2.0, 3.0])
    const vector2 = new vec3([1.0, 2.0, 3.0])
    const vector3 = new vec3([2.0, 3.0, 4.0])

    expect(vector1.equals(vector2)).to.equal(true)
    expect(vector1.equals(vector3)).to.equal(false)
  })

  it('adds', () => {
    const vector1 = new vec3([1.0, 2.0, 3.0])
    const vector2 = new vec3([2.0, 3.0, 4.0])

    const result = vector1.add(vector2)

    expect(result.x).to.be.approximately(3.0, epsilon)
    expect(result.y).to.be.approximately(5.0, epsilon)
    expect(result.z).to.be.approximately(7.0, epsilon)
  })

  it('subtracts', () => {
    const vector1 = new vec3([1.0, 2.0, 3.0])
    const vector2 = new vec3([2.0, 4.0, 6.0])

    const result = vector1.subtract(vector2)

    expect(result.x).to.be.approximately(-1.0, epsilon)
    expect(result.y).to.be.approximately(-2.0, epsilon)
    expect(result.z).to.be.approximately(-3.0, epsilon)
  })

  */
  it('multiplies', () => {
    const vector1: ReadonlyVec3 = new Vec3(2.0, 3.0, 4.0)
    const vector2: ReadonlyVec3 = new Vec3(5.0, 6.0, 7.0)

    var result = Vec3.Multiply(vector1, vector2)

    expect(result.x).to.equal(10.0)
    expect(result.y).to.equal(18.0)
    expect(result.z).to.equal(28.0)

    var vector3 = new Vec3(2, 4, 8)

    vector3.MultiplyByNumber(2)

    expect(vector3.x).to.equal(4)
    expect(vector3.y).to.equal(8)
    expect(vector3.z).to.equal(16)

    result.MultiplyByNumber(10)

    expect(result.x).to.equal(100.0)
    expect(result.y).to.equal(180.0)
    expect(result.z).to.equal(280.0)
  })
  /*

  it('divides', () => {
    const vector1 = new vec3([2.0, 3.0, 0.8])
    const vector2 = new vec3([5.0, 6.0, 4.0])

    const result = vector1.divide(vector2)

    expect(result.x).to.be.approximately(0.4, epsilon)
    expect(result.y).to.be.approximately(0.5, epsilon)
    expect(result.z).to.be.approximately(0.2, epsilon)
  })

  it('scales', () => {
    const vector = new vec3([1.0, 2.0, 3.0])

    vector.scale(2.0)

    expect(vector.x).to.be.approximately(2.0, epsilon)
    expect(vector.y).to.be.approximately(4.0, epsilon)
    expect(vector.z).to.be.approximately(6.0, epsilon)
  })

  it('normalizes', () => {
    const vector = new vec3([1.0, 2.0, 3.0])

    vector.normalize()

    expect(vector.x).to.be.approximately(0.26726, epsilon)
    expect(vector.y).to.be.approximately(0.53452, epsilon)
    expect(vector.z).to.be.approximately(0.80178, epsilon)
  })
*/
})

import { expect } from 'chai'
import { ReadonlyVec3, vec3 } from 'gl-matrix'
import '../src/extensions/vec3'


import { epsilon } from '../src/constants'

describe('vec3', () => {

  it('resets', () => {
    var vector: vec3 = [1.0, 2.0, 3.0]

    vec3.zero(vector)

    expect(vector[0]).to.equal(0)
    expect(vector[1]).to.equal(0)
    expect(vector[2]).to.equal(0)
  })

  it('copies', () => {
    const vector1: ReadonlyVec3 = [1.0, 2.0, 3.0]
    var vector2: vec3 = [0, 0, 0];

    vec3.copy(vector2, vector1)

    expect(vector2[0]).to.equal(vector1[0])
    expect(vector2[1]).to.equal(vector1[1])
    expect(vector2[2]).to.equal(vector1[2])
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
    const vector1: vec3 = [2.0, 3.0, 4.0]
    const vector2: vec3 = [5.0, 6.0, 7.0]

    var result = vec3.multiply(vector1, vector1, vector2)

    expect(result[0]).to.be.approximately(10.0, epsilon)
    expect(result[1]).to.be.approximately(18.0, epsilon)
    expect(result[2]).to.be.approximately(28.0, epsilon)

    result = vec3.multiply(result, vector2, 10)

    expect(result[0]).to.equal(50.0)
    expect(result[1]).to.equal(60.0)
    expect(result[2]).to.equal(70.0)

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

import type Box from "../collision/Box"
import type { FixedArray } from "../containers"
import type { Vec3 } from "../math"
import Contact from "./Contact"

export default class Manifold {
  // TODO: Better defults
  public A!: Box
  public B!: Box

  public normal!: Vec3 // From A to B
  public tangentVectors!: Vec3
  public bitangentVectors!: Vec3

  public contacts!: FixedArray<8, Contact>
  public contactCount = 0

  public next?: Manifold
  public prev?: Manifold

  public sensor?: boolean

  public constructor() {
    for (let index = 0; index < 8; index += 1) {
      this.contacts[index] = new Contact()
    }
  }

  public SetPair(a: Box, b: Box): void {
    this.A = a
    this.B = b

    this.sensor = a.sensor || b.sensor
  }
}

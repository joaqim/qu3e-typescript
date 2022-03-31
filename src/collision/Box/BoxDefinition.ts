import { Transform, Vec3 } from "@math"

export class BoxDefinition {
  public Friction: number
  public Restitution: number
  public Density: number
  public Sensor: boolean
  public Tx: Transform
  public E: Vec3

  public constructor() {
    this.Friction = 0.4
    this.Restitution = 0.2
    this.Density = 1
    this.Sensor = false
    this.Tx = Transform.Identity
    this.E = new Vec3(0.5, 0.5, 0.5)
  }

  public Set(tx: Transform, extents: Vec3): void {
    this.Tx = tx
    this.E = extents.MultiplyByNumber(0.5)
  }

  public set SetFriction(friction: number) {
    this.Friction = friction
  }

  public set SetRestitution(restitution: number) {
    this.Restitution = restitution
  }

  public set SetDensity(density: number) {
    this.Density = density
  }

  public set SetSensor(sensor: boolean) {
    this.Sensor = sensor
  }
}

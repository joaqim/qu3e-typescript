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

  public SetFriction(friction: number): void {
    this.Friction = friction
  }

  public SetRestitution(restitution: number): void {
    this.Restitution = restitution
  }

  public SetDensity(density: number): void {
    this.Density = density
  }

  public SetSensor(sensor: boolean): void {
    this.Sensor = sensor
  }
}

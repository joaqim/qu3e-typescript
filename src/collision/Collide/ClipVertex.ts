import { FeaturePair } from "@dynamics/Contact";
import Vec3 from "@math/Vec3";

export class ClipVertex {
  // TODO: Better defaults
  public v!: Vec3;
  public f!: FeaturePair;

  constructor() {
    this.v = new Vec3(0, 0, 0);
  }
}

import type Box from "@collision/Box"
import Collide from "@collision/Collide"
import type Body from "../Body"
import Manifold from "../Manifold"
import { ContactFlags } from "./Contact"
import ContactEdge from "./ContactEdge"

export default class ContactConstraint {
  public A?: Box
  public B?: Box

  public bodyA?: Body
  public bodyB?: Body

  public edgeA: ContactEdge
  public edgeB: ContactEdge

  public friction?: number
  public restitution?: number

  public manifold: Manifold
  public flag?: ContactFlags

  public constructor(
    A?: Box,
    B?: Box,
    bodyA?: Body,
    bodyB?: Body,
    flag?: ContactFlags,
    friction?: number,
    restitution?: number,
  ) {
    this.manifold = new Manifold()
    this.edgeA = new ContactEdge()
    this.edgeB = new ContactEdge()

    this.A = A
    this.B = B
    this.bodyA = bodyA
    this.bodyB = bodyB

    this.flag = flag
    this.friction = friction
    this.restitution = restitution
  }

  public SolveCollision(): void {
    if (this.A && this.B && this.flag) {
      this.manifold.contactCount = 0

      Collide.BoxtoBox(this.manifold, this.A, this.B)

      if (this.manifold.contactCount > 0) {
        if ((this.flag & ContactFlags.Colliding) > 0) {
          this.flag |= ContactFlags.WasColliding
        } else this.flag |= ContactFlags.Colliding
      } else if ((this.flag & ContactFlags.Colliding) > 0) {
        this.flag &= ~ContactFlags.Colliding
        this.flag |= ContactFlags.WasColliding
      } else {
        this.flag &= ~ContactFlags.WasColliding
      }
    }
  }
}

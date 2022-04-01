import type Box from "@collision/Box"
import type Body from "../Body"
import Manifold from "../Manifold"
import ContactEdge from "./ContactEdge"
import type { ContactFlags } from "./Contact"

export default class ContactConstraint {
  public A: Box
  public B: Box

  public bodyA: Body
  public bodyB: Body

  public edgeA: ContactEdge
  public edgeB: ContactEdge

  public friction: number
  public restitution: number

  public manifold: Manifold
  public flags: ContactFlags

  public constructor(
    A: Box,
    B: Box,
    bodyA: Body,
    bodyB: Body,
    flags: ContactFlags,
    friction: number,
    restitution: number,
  ) {
    this.manifold = new Manifold()
    this.edgeA = new ContactEdge()
    this.edgeB = new ContactEdge()

    this.A = A
    this.B = B
    this.bodyA = bodyA
    this.bodyB = bodyB

    this.flags = flags
    this.friction = friction
    this.restitution = restitution
  }
}

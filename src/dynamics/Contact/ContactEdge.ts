import type Body from "../Body"
import type ContactConstraint from "./ContactConstraint"

export default class ContactEdge {
  public other?: Body
  public constraint?: ContactConstraint
}

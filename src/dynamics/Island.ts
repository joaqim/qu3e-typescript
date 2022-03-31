import type { ContactConstraint } from "@dynamics"
import type { Vec3 } from "@math"
import type Body from "./Body"

export interface VelocityState {
  w: Vec3
  v: Vec3
}

export default class Island {
  public bodies: Body[]
  public velocities: VelocityState[]
  public contacts: ContactConstraint[]
  // public contactStates: ContactConstraintState[]
  // public contactSolver: ContactSolver
  private readonly dt?: number
  private readonly gravity?: Vec3
  private readonly iterations?: number
  private readonly allowSleep?: boolean
  private readonly enableFriction?: boolean

  public constructor() {
    this.bodies = []
    this.velocities = []
    this.contacts = []
    // this.contactStates = []
    // this.contactSolver = []
  }

  public Clear(): void {
    this.bodies = []
    this.velocities = []
    this.contacts = []

    /*
      for(var state in this.contactStates) {
        for (let i = 0; i < state.contactCount; i+=1 ) {
            this.contactState.Free(state.contacts[i])
        }
        // NOTE: Singleton class:
        ContactConstraintState.Free(state)
       // Array.Clear(state.contacts, 0, state.contactCount);
      }
      this.contactStates = []
      */
  }
}

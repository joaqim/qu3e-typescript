/* eslint-disable max-classes-per-file */
import type { ReadonlyVec3 } from "@math"
import { Mat3, Quaternion, Vec3 } from "@math"
import type Body from "./Body"
import { BodyFlags } from "./Body/Body"
import type ContactConstraint from "./Contact/ContactConstraint"
import type ContactSolver from "./Contact/ContactSolver"
import type { ContactConstraintState } from "./Contact/ContactSolver"

export class VelocityState {
  public linearVelocity: Vec3
  public angularVelocity: Vec3
  public constructor(
    linearVelocity: ReadonlyVec3,
    angularVelocity: ReadonlyVec3,
  ) {
    this.linearVelocity = linearVelocity
    this.angularVelocity = angularVelocity
  }
}

export default class Island {
  // TODO: Better defaults
  public bodies: Body[]
  public velocities: VelocityState[]
  public contacts: ContactConstraint[]
  public contactStates!: ContactConstraintState[]
  public contactSolver!: ContactSolver
  public dt!: number
  public gravity!: Vec3
  public iterations!: number
  public allowSleep!: boolean
  public enableFriction!: boolean

  public constructor() {
    this.bodies = []
    this.velocities = []
    this.contacts = []
    // this.contactStates = []
    // this.contactSolver = []
  }

  public Solve(): void {
    // Apply gravity
    // Integrate velocities and create state buffers, calculate world inertia
    for (let index = 0; index < this.bodies.length; index += 1) {
      const body = this.bodies[index]
      // const v = this.velocities[index]

      if ((body.Flags & BodyFlags.Dynamic) > 0) {
        body.ApplyLinearForce(Vec3.Scale(this.gravity, body.GravityScale))

        // Calculate world space intertia tensor
        const r = body.Tx.rotation
        body.InvInertiaWorld = Mat3.Multiply(r, body.InvInertiaModel).Multiply(
          Mat3.Transpose(r),
        )

        // Integrate velocity
        // body.LinearVelocity += (body.Force * body.InvMass) * Dt;
        body.LinearVelocity.Add(
          Vec3.Scale(body.Force, body.InvMass).Scale(this.dt),
        )
        // body.AngularVelocity += (body.InvInertiaWorld * body.Torque) * Dt
        body.AngularVelocity.Add(
          Mat3.MultiplyByVec3(body.InvInertiaWorld, body.Torque).Scale(this.dt),
        )

        // From Box2D!
        // Apply damping.
        // ODE: dv/dt + c * v = 0
        // Solution: v(t) = v0 * exp(-c * t)
        // Time step: v(t + dt) = v0 * exp(-c * (t + dt)) = v0 * exp(-c * t) * exp(-c * dt) = v * exp(-c * dt)
        // v2 = exp(-c * dt) * v1
        // Pade approximation:
        // v2 = v1 * 1 / (1 + c * dt)
        // body.LinearVelocity *= 1 / (1 + Dt * body.LinearDamping);
        body.LinearVelocity.Scale(1 / (1 + this.dt * body.LinearDamping))
        // body.AngularVelocity *= 1 / (1 + Dt * body.AngularDamping);
        body.AngularVelocity.Scale(1 / (1 + this.dt * body.AngularDamping))
      }

      this.velocities[index] = new VelocityState(
        body.LinearVelocity,
        body.AngularVelocity,
      )
    }

    // Create contact solver, pass in state buffers, create buffers for contacts
    // Initialize velocity constraint for normal + friction and warm start
    this.contactSolver.Initialize(this)
    this.contactSolver.PreSolve(this.dt)

    // Solve contacts
    for (let index = 0; index < this.iterations; index += 1)
      this.contactSolver.Solve()

    this.contactSolver.ShutDown()

    // Copy back state buffers
    // Integrate positions
    for (let index = 0; index < this.bodies.length; index += 1) {
      {
        const body = this.bodies[index]
        const v = this.velocities[index]

        // TODO: better negate bitwise condition
        if (!((body.Flags & BodyFlags.Static) > 0)) {
          body.LinearVelocity = v.linearVelocity
          body.AngularVelocity = v.angularVelocity

          // Integrate position
          body.WorldCenter.Add(Vec3.Scale(body.LinearVelocity, this.dt))
          body.Q.Integrate(body.AngularVelocity, this.dt)
          body.Q = Quaternion.Normalize(body.Q)
          body.Tx.rotation = body.Q.ToMat3()
        }
      }

      if (this.allowSleep) {
        // Find minimum sleep time of the entire island
        let minSleepTime = Number.MAX_SAFE_INTEGER

        // for (let i = 0; i < this.bodies.length; i+=1)
        for (const body of this.bodies) {
          // let body = this.bodies[i];

          if (!((body.Flags & BodyFlags.Static) > 0)) {
            const sqrLinVel = Vec3.Dot(body.LinearVelocity, body.LinearVelocity)
            const callbackAngVel = Vec3.Dot(
              body.AngularVelocity,
              body.AngularVelocity,
            )
            const linTol = Q3_SLEEP_LINEAR
            const angTol = Q3_SLEEP_ANGULAR

            if (sqrLinVel > linTol || callbackAngVel > angTol) {
              minSleepTime = 0
              body.SleepTime = 0
            } else {
              body.SleepTime += this.dt
              minSleepTime = Math.min(minSleepTime, body.SleepTime)
            }
          }
        }

        // Put entire island to sleep so long as the minimum found sleep time
        // is below the threshold. If the minimum sleep time reaches below the
        // sleeping threshold, the entire island will be reformed next step
        // and sleep test will be tried again.
        if (minSleepTime > Q3_SLEEP_TIME) {
          for (const body of this.bodies) {
            body.SetToSleep()
          }
        }
      }
    }
  }

  public Clear(): void {
    this.bodies = []
    this.velocities = []
    this.contacts = []

    for (const state of this.contactStates) {
      for (let index = 0; index < state.contactCount; index += 1) {
        // TODO
        // this.contactStates.Free(state.contacts[index])
      }
      // NOTE: Singleton class:
      // ContactConstraintState.Free(state)
      // Array.Clear(state.contacts, 0, state.contactCount);
    }
    this.contactStates = []
  }
}

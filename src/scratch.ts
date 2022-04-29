import { BoxDefinition } from "./collision"
import type Box from "./collision/Box"
import { BodyDefinition } from "./dynamics"
import type Body from "./dynamics/Body"
import { BodyType } from "./dynamics/Body/Body"
import { Vec3, Transform } from "./math"
import { Scene } from "./scene/Scene"

export function InitPhysics(boxes: Box[]): Scene {
  const gravity = new Vec3(0, -9.8, 10)
  const scene = new Scene(1 / 100, gravity, 10)
  // Create the floor
  const bodyDef = new BodyDefinition()
  let body = scene.CreateBody(bodyDef)

  const boxDef = new BoxDefinition()
  boxDef.SetRestitution(0.5)
  boxDef.SetFriction(0.7)
  const tx = Transform.Identity
  boxDef.Set(tx, new Vec3(50, 1, 50))

  body.AddBox(boxDef)

  bodyDef.bodyType = BodyType.DynamicBody
  bodyDef.active = true
  bodyDef.awake = true
  boxDef.Set(tx, new Vec3(1, 1, 1))

  for (let index = 0; index < 8; index += 1) {
    for (let subIndex = 0; subIndex < 8; subIndex += 1) {
      bodyDef.position.SetRow(-5 + 1.25 * index, 5, -5 + 1.25 * subIndex)
      bodyDef.axis = new Vec3(0, 0, 1)
      // bodyDef.angle = randomFloat() * Math.PI

      body = scene.CreateBody(bodyDef)
      boxes.push(body.AddBox(boxDef))
    }
  }

  return scene
}

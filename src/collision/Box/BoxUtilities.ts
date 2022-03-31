import Box from "@collision/Box"
import Body from "@dynamics/Body"
import { BoxDefinition } from "./BoxDefinition"

export function CreateBox(definition: BoxDefinition, body: Body): Box {
  return new Box(
    definition.Tx,
    definition.E,
    body,
    definition.Friction,
    definition.Restitution,
    definition.Density,
    definition.Sensor,
  )
}

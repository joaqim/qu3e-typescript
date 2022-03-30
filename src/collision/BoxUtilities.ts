import type Body from "@dynamics/Body";
import type BoxDefinition from "./BoxDefinition";
import Box from "./Box";

export function CreateBox(definition: BoxDefinition, body: Body): Box {
  return new Box(
    definition.Tx,
    definition.E,
    body,
    definition.Friction,
    definition.Restitution,
    definition.Density,
    definition.Sensor
  );
}

type Grow<T, A extends T[]> = ((x: T, ...xs: A) => void) extends (
  ...a: infer X
) => void
  ? X
  : never;
export type GrowToSize<T, A extends T[], N extends number> = {
  0: A;
  1: GrowToSize<T, Grow<T, A>, N>;
}[A["length"] extends N ? 0 : 1];
export type FixedArray<N extends number, T = number> = GrowToSize<T, [], N>;


type Grow<T, A extends Array<T>> = ((x: T, ...xs: A) => void) extends ((...a: infer X) => void) ? X : never;
type GrowToSize<T, A extends Array<T>, N extends number> = { 0: A, 1: GrowToSize<T, Grow<T, A>, N> }[A['length'] extends N ? 0 : 1];

type FixedArray<N extends number> = GrowToSize<number, [], N>;

//export interface matrix<TSize extends number> {
  //private values: FixedArray<number, TSize>
//}

export type matrix2 = FixedArray<4>
export type matrix3 = FixedArray<9>// Two extra slots for rotation?
export type matrix4 = FixedArray<18> 


// What a twin asserts about the module it mirrors, as
// `true satisfies Twin<Mirrored, Native, Widened>` with each side's exports.

type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false

type Fits<Mirrored, Native, Name, Widened> = Name extends Widened
  ? Native extends Mirrored
    ? true
    : false
  : Same<Mirrored, Native>

type Mismatched<Mirrored, Native, Widened> = {
  [Name in keyof Mirrored | keyof Native]: Name extends keyof Mirrored
    ? Name extends keyof Native
      ? Fits<Mirrored[Name], Native[Name], Name, Widened> extends true
        ? never
        : Name
      : Name
    : Name
}[keyof Mirrored | keyof Native]

/**
 * `true` when a twin's exports, `Native`, match its module's, `Mirrored`,
 * name for name and type for type. A name in `Widened` may instead be any
 * type that still fits where the mirrored one goes.
 */
type Twin<Mirrored, Native, Widened extends PropertyKey = never> = [
  Mismatched<Mirrored, Native, Widened>,
] extends [never]
  ? true
  : { differs: Mismatched<Mirrored, Native, Widened> }

export type { Twin }

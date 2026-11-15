// Compiled by `pnpm typecheck`, never run. Each `@ts-expect-error` fails the
// build if its line stops being an error.
import type { Twin } from "../src/foundation/kernel/twin"

type Mirrored = {
  focus: (element: HTMLElement, key?: string) => void
  Layer: { contains: (node: Node) => boolean }
}

true satisfies Twin<Mirrored, Mirrored>

// @ts-expect-error A missing export.
true satisfies Twin<Mirrored, Pick<Mirrored, "focus">>

// @ts-expect-error An extra export.
true satisfies Twin<Mirrored, Mirrored & { extra: () => void }>

// @ts-expect-error A parameter of another type.
true satisfies Twin<
  Mirrored,
  Omit<Mirrored, "focus"> & { focus: (element: string) => void }
>

// @ts-expect-error A type that differs, with no declared widening.
true satisfies Twin<
  Mirrored,
  Omit<Mirrored, "Layer"> & { Layer: { contains: (node: unknown) => boolean } }
>

true satisfies Twin<
  Mirrored,
  Omit<Mirrored, "Layer"> & {
    Layer: { contains: (node: unknown) => boolean; onBack?: () => boolean }
  },
  "Layer"
>

// @ts-expect-error A widened type must still fit where the mirrored one goes.
true satisfies Twin<
  Mirrored,
  Omit<Mirrored, "Layer"> & { Layer: { contains: (node: Node) => string } },
  "Layer"
>

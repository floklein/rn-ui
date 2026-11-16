import type {
  OptionsOf,
  Part,
  Primitive,
  PropsOf,
  SlotName,
} from "@ui-sdk/core"
import { nativeHost, setNativeHost } from "@ui-sdk/core/native"
import {
  attrs,
  partState,
  present,
  schemaOf,
  unwatched,
} from "@ui-sdk/core/renderer"

// What the web has and React Native doesn't. React Native defines `window`,
// `navigator` and timers, so reading them is no fault.
const webGlobals = [
  "document",
  "location",
  "localStorage",
  "sessionStorage",
  "matchMedia",
  "getComputedStyle",
]

function watchHostReads<T>(report: (reading: string) => void, read: () => T) {
  const host = nativeHost()
  const saved = webGlobals.map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const
  )
  for (const name of webGlobals) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        report(`reads \`${name}\``)
        return undefined
      },
    })
  }
  setNativeHost({
    focus: () => report("asks the native host to focus a part"),
    field: () => {
      report("asks the native host for a text field")
      return undefined
    },
    announce: () => report("asks the native host to announce"),
    activate: () => report("asks the native host to activate a control"),
    compare: () => {
      report("asks the native host where parts render")
      return 0
    },
    isRTL: () => {
      report("asks the native host for the direction")
      return false
    },
    box: () => {
      report("asks the native host to measure a part")
      return undefined
    },
    follow: () => {
      report("asks the native host to follow touches")
      return () => {}
    },
    adjustable: () => {
      report("asks the native host for a screen reader's adjustments")
      return () => {}
    },
  })
  try {
    return read()
  } finally {
    setNativeHost(host)
    for (const [name, descriptor] of saved) {
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor)
      } else {
        delete (globalThis as Record<string, unknown>)[name]
      }
    }
  }
}

/**
 * Creates a primitive as the native adapter does and reads each
 * slot's attributes, state and presence, checking none of it reads a web
 * global or asks the native host anything: those belong to a part's mounted
 * view, never to creating or rendering one. The counterpart of
 * `checkServer`'s rule. Throws one error that lists every problem.
 *
 * @example
 * checkCreation(switchPrimitive, { defaultChecked: true })
 *
 * @experimental
 */
function checkCreation<P extends Primitive>(
  primitive: P,
  options: OptionsOf<P>
) {
  const problems = new Set<string>()
  const instance = watchHostReads(
    (what) => problems.add(`creating it ${what}`),
    () =>
      unwatched(() =>
        primitive({ ...(options as object), id: "creation" } as OptionsOf<P>)
      )
  )
  for (const slot of Object.keys(schemaOf(primitive).slots) as SlotName<P>[]) {
    const part = instance.part(slot, {} as PropsOf<P, typeof slot>) as Part
    watchHostReads(
      (what) => problems.add(`\`${slot}\` ${what} while it renders`),
      () => {
        attrs(part)
        partState(part)
        present(part)
      }
    )
  }
  instance.destroy()
  if (problems.size) {
    throw new Error(
      `checkCreation found ${problems.size} problem${problems.size === 1 ? "" : "s"}:\n- ${[...problems].join("\n- ")}`
    )
  }
}

export { checkCreation }

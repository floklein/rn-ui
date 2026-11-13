// PROTOTYPE (issue #14). The generic half of the native adapter, in the shape
// of `@ui-sdk/react`'s: it reads a slot's declarative fields, delivers
// `press`, and never calls `bind`, `asleep`, `connect` or the `on` handlers.
import type {
  ChangeSource,
  OptionsOf,
  Part,
  Primitive,
  PropSpec,
  PropsOf,
  SlotName,
  StateOf,
  TypesOf,
} from "@ui-sdk/core"
import {
  liveAttrs,
  withSource,
  type NativeBehavior,
} from "@ui-sdk/core/native"
import {
  attrs,
  commit,
  keep,
  partState,
  present,
  press,
  release,
  schemaOf,
  subscribe,
  unwatched,
} from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  AccessibilityInfo,
  Pressable,
  View,
  type HostInstance,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native"
import { mergeAccessibility, splitUser, toNativeProps } from "./accessibility"
import { host, views } from "./native-host"
import {
  mergeProps,
  renderElement,
  type Interaction,
  type RenderProp,
} from "./render-element"

// An activation carries no event on the native host, so the source is named
// here. React Native doesn't say whether a press was a screen reader's.
let screenReader = false
AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
  screenReader = enabled
})
AccessibilityInfo.addEventListener("screenReaderChanged", (enabled) => {
  screenReader = enabled
})
const pressSource = () => (screenReader ? "virtual" : "touch") as ChangeSource

/**
 * What `usePrimitive` returns, and what a component's context holds.
 * @experimental
 */
type PrimitiveHandle<P extends Primitive> = {
  /** The primitive it's an instance of. */
  primitive: P
  /** The core instance `usePrimitive` made. */
  instance: ReturnType<P>
  /** The component's behavior on the native host, which its parts run. */
  behavior?: NativeBehavior<any>
  /** The instance's state now. Reading it doesn't subscribe. */
  readonly state: TypesOf<P>["state"]
  /** The methods its definition declares. */
  api: TypesOf<P>["api"]
}

/**
 * Creates an instance of a primitive for this component, keeps its options
 * current, attaches its native behavior while React keeps it, and destroys
 * it when the component leaves.
 * @experimental
 */
function usePrimitive<P extends Primitive>(
  primitive: P,
  options: OptionsOf<P>,
  behavior?: NativeBehavior<any>
) {
  const id = `ui-sdk-${React.useId()}`
  // `document` is undefined on Hermes, so core keeps nothing by itself.
  const [instance] = React.useState(() =>
    unwatched(
      () => primitive({ ...options, controller: undefined, id }) as ReturnType<P>
    )
  )
  React.useLayoutEffect(() => {
    keep(instance)
    const detach = behavior?.attach?.(instance, host)
    return () => {
      detach?.()
      release(instance)
    }
  }, [instance, behavior])
  React.useLayoutEffect(() => {
    instance.setOptions({ ...options, id })
  })
  // A microtask later, so StrictMode's unmount and remount destroys nothing.
  const mounted = React.useRef(0)
  React.useEffect(() => {
    mounted.current++
    return () => {
      mounted.current--
      queueMicrotask(() => {
        if (!mounted.current) {
          instance.destroy()
        }
      })
    }
  }, [instance])
  return React.useMemo(() => {
    const handle: PrimitiveHandle<P> = {
      primitive,
      instance,
      behavior,
      get state() {
        return instance.get()
      },
      get api() {
        return instance.api as TypesOf<P>["api"]
      },
    }
    return handle
  }, [primitive, instance, behavior])
}

type Scope = React.Context<PrimitiveHandle<any> | null>
const scopes = new WeakMap<Primitive, Scope>()
function scopeOf(primitive: Primitive) {
  const known = scopes.get(primitive)
  if (known) {
    return known
  }
  const scope: Scope = React.createContext<PrimitiveHandle<any> | null>(null)
  scopes.set(primitive, scope)
  return scope
}

/** Shares an instance with the parts inside, for a root that renders no view of its own. */
function HandleScope({
  handle,
  children,
}: {
  handle: PrimitiveHandle<any>
  children?: React.ReactNode
}) {
  const Scope = scopeOf(handle.primitive)
  return <Scope.Provider value={handle}>{children}</Scope.Provider>
}

/** The nearest instance of a primitive, for a part written by hand. */
function useHandle<P extends Primitive>(primitive: P) {
  const handle = React.useContext(scopeOf(primitive))
  if (!handle) {
    throw new Error(
      `The ${primitive.name} parts must be used inside their root.`
    )
  }
  return handle as PrimitiveHandle<P>
}

/**
 * Props every native part takes: its host's props, `render`, and a style,
 * class name and children that may be functions of the part's state and its
 * interaction.
 * @experimental
 */
type PartProps<State = {}> = {
  /** Styles, or a function of the part's state and interaction that returns them. */
  style?:
    | StyleProp<ViewStyle | TextStyle>
    | ((
        state: State,
        interaction: Interaction
      ) => StyleProp<ViewStyle | TextStyle>)
  /** A class name for a styling library, or a function that returns one. Forwarded as a string. */
  className?:
    | string
    | ((state: State, interaction: Interaction) => string | undefined)
  /** Content, or a function of the part's state and interaction that returns it. */
  children?:
    | React.ReactNode
    | ((state: State, interaction: Interaction) => React.ReactNode)
  /** Renders your own element: one that receives the part's props, or a function of the props, the state and the interaction. */
  render?: RenderProp<State>
  [hostProp: string]: unknown
}

const idle: Interaction = { pressed: false, hovered: false, focused: false }

type ViewRef = (view: HostInstance | null) => (() => void) | void
const viewRefs = new WeakMap<Part, ViewRef>()

// Registers the part's view with the host and runs the slot's native
// behavior while that view is mounted, as `bind` runs on the DOM host.
function viewRef(part: Part, behavior: NativeBehavior<any> | undefined) {
  let ref = viewRefs.get(part)
  if (!ref) {
    ref = (view) => {
      if (!view) {
        return
      }
      views.set(part, view)
      const cleanup = behavior?.slots?.[part.slot]?.(part, host)
      return () => {
        cleanup?.()
        views.delete(part)
      }
    }
    viewRefs.set(part, ref)
  }
  return ref
}

const accessibilityProps = (user: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(user).filter(
      ([name]) =>
        name.startsWith("accessib") || name === "importantForAccessibility"
    )
  )

/**
 * Renders one part of a primitive: its host, with the slot's attributes
 * translated to accessibility props and its `press` delivered, re-rendered
 * when the instance changes, or nothing while the slot isn't present.
 * `handle` is `usePrimitive`'s, or the primitive, whose nearest instance it
 * uses. `Host` defaults to `Pressable` for a slot that is pressed, and to
 * `View`.
 * @experimental
 */
function usePart<P extends Primitive, S extends SlotName<P>>(
  handle: P | PrimitiveHandle<P>,
  slot: S,
  slotProps: PropsOf<P, S> = {} as PropsOf<P, S>,
  props: PartProps<StateOf<P, S>> = {},
  Host?: React.ElementType
) {
  const primitive = typeof handle === "function" ? handle : handle.primitive
  const Scope = scopeOf(primitive)
  const nearest = React.useContext(Scope)
  const owner = (typeof handle === "function" ? nearest : handle) as
    PrimitiveHandle<P> | null
  if (!owner) {
    throw new Error(
      `The ${primitive.name} ${slot} part must be used inside its root.`
    )
  }
  const part = owner.instance.part(slot, slotProps, true) as Part
  const [, rerender] = React.useReducer((count: number) => count + 1, 0)
  const [interaction, setInteraction] = React.useState(idle)
  React.useLayoutEffect(() => {
    commit(part, slotProps)
  })
  React.useLayoutEffect(() => subscribe(part, rerender), [part])

  if (!present(part, slotProps)) {
    return null
  }
  const { render, ...user } = props
  const state = partState(part, slotProps) as StateOf<P, S>
  const activate = press(part, slotProps)
  const { aria, rest } = splitUser(user)
  const translated = toNativeProps({
    ...aria,
    ...attrs(part, slotProps),
    ...liveAttrs(part, slotProps),
  }).props
  const set = (change: Partial<Interaction>) => () =>
    setInteraction((current) => ({ ...current, ...change }))
  const handlers = activate
    ? {
        onPress: () => withSource(pressSource(), activate),
        onPressIn: set({ pressed: true }),
        onPressOut: set({ pressed: false }),
        onHoverIn: set({ hovered: true }),
        onHoverOut: set({ hovered: false }),
        onFocus: set({ focused: true }),
        onBlur: set({ focused: false }),
      }
    : {}
  const element = renderElement(
    Host ?? (activate ? Pressable : View),
    mergeProps(
      handlers,
      rest,
      translated,
      accessibilityProps(rest),
      mergeAccessibility(translated, rest),
      { ref: viewRef(part, owner.behavior) }
    ),
    render,
    state,
    interaction
  )
  return owner === nearest ? (
    element
  ) : (
    <Scope.Provider value={owner}>{element}</Scope.Provider>
  )
}

const kindOf = (spec: PropSpec) => (typeof spec === "object" ? spec.kind : spec)

// Splits a component's props into those the schema names and the host's own.
function split(props: Record<string, any>, schema: Record<string, PropSpec>) {
  const named: Record<string, any> = {}
  const rest: Record<string, any> = {}
  for (const key in props) {
    ;(key in schema && kindOf(schema[key]) ? named : rest)[key] = props[key]
  }
  return [named, rest] as const
}

type Pascal<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Capitalize<Head>}${Pascal<Tail>}`
  : Capitalize<Name>

const pascal = (name: string) =>
  name.replace(/(^|-)(\w)/g, (_, _dash, char: string) => char.toUpperCase())

type Hosts<P extends Primitive> = { [S in SlotName<P>]?: React.ElementType }

type Parts<P extends Primitive, H extends Hosts<P>> = {
  Root: (
    props: OptionsOf<P> & PartProps<StateOf<P, "root" & SlotName<P>>>
  ) => React.ReactElement | null
} & {
  [S in Exclude<keyof H, "root"> & SlotName<P> as Pascal<S>]: (
    props: PropsOf<P, S> & PartProps<StateOf<P, S>>
  ) => React.ReactElement | null
}

/**
 * A `Root` and a Pascal-case part per hosted slot, typed from the primitive,
 * for a primitive with a `root` slot. One without, like Dialog, writes its
 * root by hand with `usePrimitive` and `HandleScope`.
 * Where `@ui-sdk/react` takes an HTML tag per slot, this takes a
 * `react-native` host component. `behavior` is the component's native
 * behavior from core, which `Root` attaches.
 * @experimental
 */
function createParts<P extends Primitive, H extends Hosts<P>>(
  primitive: P,
  hosts: H,
  behavior?: NativeBehavior<any>
) {
  const schema = schemaOf(primitive)
  const parts: Record<string, (props: any) => React.ReactElement | null> = {
    Root(props) {
      const [options, rest] = split(props, schema.options)
      const handle = usePrimitive(primitive, options as OptionsOf<P>, behavior)
      return usePart(
        handle,
        "root" as SlotName<P>,
        undefined,
        rest,
        hosts.root
      )
    },
  }
  for (const slot of Object.keys(hosts)) {
    if (slot === "root") {
      continue
    }
    parts[pascal(slot)] = (props) => {
      const [named, rest] = split(props, schema.slots[slot] ?? {})
      return usePart(
        primitive,
        slot as SlotName<P>,
        named as PropsOf<P, SlotName<P>>,
        rest,
        hosts[slot as SlotName<P>]
      )
    }
  }
  return parts as Parts<P, H>
}

export {
  createParts,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
}

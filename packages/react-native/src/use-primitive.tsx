// A part reads its slot's declarative fields and delivers `press`. It never
// runs `bind`, `asleep`, `connect` or the `on` handlers, which need the DOM.
import type {
  OptionsOf,
  Part,
  Primitive,
  PropSpec,
  PropsOf,
  SlotName,
  StateOf,
  TypesOf,
} from "@ui-sdk/core"
import type { CheckboxPrimitive } from "@ui-sdk/core/checkbox"
import type { FileInputPrimitive } from "@ui-sdk/core/file-input"
import type { RadioGroupPrimitive } from "@ui-sdk/core/radio"
import type { RatingPrimitive } from "@ui-sdk/core/rating"
import type { SegmentedControlPrimitive } from "@ui-sdk/core/segmented-control"
import type { SliderPrimitive } from "@ui-sdk/core/slider"
import type { SwitchPrimitive } from "@ui-sdk/core/switch"
import {
  attrs,
  commit,
  type PrimitiveGeneric,
  keep,
  liveAttrs,
  partState,
  present,
  press,
  release,
  schemaOf,
  subscribe,
  unwatched,
  withSource,
  yieldToAuthor,
} from "@ui-sdk/core/renderer"
import * as React from "react"
import { Platform, Pressable, View, type HostInstance } from "react-native"
import { mergeAccessibility, splitAria, toNativeProps } from "./accessibility"
import { pressSource, views } from "./native-host"
import {
  idle,
  mergeProps,
  renderElement,
  type Interaction,
  type RenderProp,
} from "./render-element"

type WebOnlyName = "container" | "shortcut" | "name" | "form"

// Options and slot props as native takes them: without the web-only names,
// and without `modal="trap-focus"`, which the `Modal`'s isolation replaces.
type Native<T> = {
  [K in keyof T as K extends WebOnlyName ? never : K]: K extends "modal"
    ? Exclude<T[K], "trap-focus">
    : T[K]
}

// Their `input` slot is the hidden input a form submits, while core's other
// `input` slots are text fields. Kept by hand: a new hidden `input` goes here.
type FormInputOwner =
  | CheckboxPrimitive
  | FileInputPrimitive
  | RadioGroupPrimitive
  | RatingPrimitive
  | SegmentedControlPrimitive
  | SliderPrimitive
  | SwitchPrimitive

type NativeSlot<P extends Primitive> = Exclude<
  SlotName<P>,
  | "hidden-input"
  | "form-input"
  | "value-input"
  | "group-input"
  | (P extends FormInputOwner ? "input" : never)
>

/**
 * What `usePrimitive` returns, and what a component's context holds: one object for the instance's life.
 * @experimental
 */
type PrimitiveHandle<P extends Primitive> = {
  /** The primitive it's an instance of. */
  primitive: P
  /** The core instance `usePrimitive` made, with its `get()`, `part()` and `api`. */
  instance: ReturnType<P>
  /** The instance's state now. Reading it doesn't subscribe; a part's `render` and style functions get the state they render. */
  readonly state: TypesOf<P>["state"]
  /** The methods its definition declares, like Switch's `toggle`. */
  api: TypesOf<P>["api"]
}

/**
 * Creates an instance of a primitive for this component, keeps its options
 * current on every render, and destroys it when the component leaves. Render
 * its root with `usePart`, which shares the instance with the parts inside.
 *
 * @example
 * function MuteButton({ onMutedChange, ...props }: PartProps<typeof Pressable, MuteButtonState> & { onMutedChange?: (muted: boolean) => void }) {
 *   const button = usePrimitive(muteButton, { onMutedChange })
 *   return usePart(button, "root", {}, props, Pressable)
 * }
 * @experimental
 */
function usePrimitive<P extends Primitive>(
  primitive: P,
  options: Native<OptionsOf<P>>
) {
  const id = `ui-sdk-${React.useId()}`
  // Without its controller until it commits, so StrictMode's second
  // initializer call, which React throws away, never takes it.
  const [instance] = React.useState(() =>
    unwatched(
      () =>
        primitive({ ...options, controller: undefined, id }) as ReturnType<P>
    )
  )
  React.useLayoutEffect(() => {
    keep(instance)
    return () => release(instance)
  }, [instance])
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
      get state() {
        return instance.get()
      },
      get api() {
        return instance.api as TypesOf<P>["api"]
      },
    }
    return handle
  }, [primitive, instance])
}

type Scope = {
  handle: PrimitiveHandle<Primitive>
  around: Record<string, Record<string, unknown>>
}
type Scopes = {
  context: React.Context<Scope | null>
  provides: Set<string>
  keyed: Set<string>
}
const scopes = new WeakMap<Primitive, Scopes>()
function scopeOf(primitive: Primitive) {
  let found = scopes.get(primitive)
  if (!found) {
    found = {
      context: React.createContext<Scope | null>(null),
      provides: new Set(),
      keyed: new Set(),
    }
    scopes.set(primitive, found)
  }
  return found
}

function HandleScope({
  handle,
  children,
}: {
  handle: PrimitiveHandle<Primitive>
  children?: React.ReactNode
}) {
  const { context } = scopeOf(handle.primitive)
  const scope = React.useMemo(() => ({ handle, around: {} }), [handle])
  return <context.Provider value={scope}>{children}</context.Provider>
}

/** The nearest instance of a primitive, for a part written by hand that calls its api. */
function useHandle<P extends Primitive>(primitive: P) {
  const handle = React.useContext(scopeOf(primitive).context)?.handle as
    PrimitiveHandle<P> | undefined
  if (!handle) {
    throw new Error(
      `The ${primitive.name} parts must be used inside their root.`
    )
  }
  return handle
}

// The host's own style, without the function `Pressable` takes in its place.
type HostStyle<Host extends React.ElementType> = Exclude<
  React.ComponentProps<Host> extends { style?: infer Style } ? Style : never,
  (...args: never[]) => unknown
>

/**
 * Props every part takes: its host's props, `render`, and a style, class
 * name and children that may be functions of the part's state and its
 * interaction. Where `@ui-sdk/react` takes an HTML tag, this takes a
 * `react-native` host component.
 * @experimental
 */
type PartProps<Host extends React.ElementType, State = {}> = Omit<
  React.ComponentProps<Host>,
  "className" | "style" | "children"
> & {
  /** Class names for a styling library, or a function of the part's state and interaction that returns them. Forwarded as a string. */
  className?:
    string | ((state: State, interaction: Interaction) => string | undefined)
  /** Styles, or a function of the part's state and interaction that returns them. Merged as an array, never flattened. */
  style?:
    | HostStyle<Host>
    | ((state: State, interaction: Interaction) => HostStyle<Host>)
  /** Renders your own element: one that receives the part's props, or a function of the props, the state and the interaction. */
  render?: RenderProp<State>
  /** Content, or a function of the part's state and interaction that returns it. */
  children?:
    | React.ReactNode
    | ((state: State, interaction: Interaction) => React.ReactNode)
}

type ViewRef = (view: HostInstance | null) => () => void
const viewRefs = new WeakMap<Part, ViewRef>()

// Forgetting the view as it unmounts keeps a later focus request from asking.
function viewRef(part: Part) {
  let ref = viewRefs.get(part)
  if (!ref) {
    ref = (view) => {
      if (view) {
        views.set(part, view)
      }
      return () => {
        if (views.get(part) === view) {
          views.delete(part)
        }
      }
    }
    viewRefs.set(part, ref)
  }
  return ref
}

function nativeProps(
  part: Part,
  slotProps: object,
  user: Record<string, unknown>
) {
  const { aria, rest } = splitAria(user)
  const translated = toNativeProps(
    {
      ...aria,
      ...yieldToAuthor(
        { ...attrs(part, slotProps), ...liveAttrs(part, slotProps) },
        (name) => aria[name] !== undefined
      ),
    },
    Platform.OS === "android" ? "android" : "ios"
  )
  return mergeProps(translated, rest, mergeAccessibility(translated, rest))
}

// A slot's state, or none for a slot that hands render functions nothing.
type PartState<P extends Primitive, S extends SlotName<P>> =
  unknown extends StateOf<P, S> ? {} : StateOf<P, S>

/**
 * Renders one part of a primitive written by hand: its host, with the slot's
 * attributes translated to accessibility props and its `press` delivered,
 * re-rendered when the instance changes, or nothing while the slot says it
 * isn't present. `handle` is `usePrimitive`'s, or the primitive, whose
 * nearest instance it uses. `Host` defaults to `Pressable` for a slot that is
 * pressed, and to `View` otherwise.
 *
 * @example
 * function RatingStar({ value, ...props }: PartProps<typeof Pressable, RatingStarState> & { value: string }) {
 *   return usePart(rating, "star", { value }, props, Pressable)
 * }
 * @experimental
 */
function usePart<P extends Primitive, S extends NativeSlot<P>>(
  handle: P | PrimitiveHandle<P>,
  slot: S,
  slotProps: Native<PropsOf<P, S>> = {} as Native<PropsOf<P, S>>,
  props: Omit<PartProps<React.ElementType, PartState<P, S>>, "ref"> & {
    ref?: React.Ref<any>
  } = {},
  Host?: React.ElementType
) {
  const primitive = typeof handle === "function" ? handle : handle.primitive
  const { context, provides, keyed } = scopeOf(primitive)
  const scope = React.useContext(context)
  const owner = (
    typeof handle === "function" ? scope?.handle : handle
  ) as PrimitiveHandle<Primitive>
  if (!owner) {
    throw new Error(
      `The ${primitive.name} ${slot} part must be used inside its root.`
    )
  }
  const own = React.useMemo<Scope>(
    () => ({ handle: owner, around: {} }),
    [owner]
  )
  const inside = scope?.handle === owner ? scope : own
  const around = keyed.has(slot)
    ? { ...slotProps, value: (slotProps as { id?: string }).id }
    : slotProps
  const provided: Scope = provides.has(slot)
    ? { handle: owner, around: { ...inside.around, [slot]: around } }
    : inside

  const part = owner.instance.part(slot, slotProps, true) as Part
  const [, rerender] = React.useReducer((count: number) => count + 1, 0)
  const [interaction, setInteraction] = React.useState(idle)
  React.useLayoutEffect(() => {
    commit(part, slotProps)
  })
  React.useLayoutEffect(() => subscribe(part, rerender), [part])

  let element: React.ReactElement | null = null
  if (present(part, slotProps)) {
    const { render, ref, ...user } = props
    const activate = press(part, slotProps)
    const host = Host ?? (activate ? Pressable : View)
    const set = (change: Partial<Interaction>) => () =>
      setInteraction((current) => ({ ...current, ...change }))
    const handlers =
      activate || host === Pressable
        ? {
            onPress: activate && (() => withSource(pressSource(), activate)),
            onPressIn: set({ pressed: true }),
            onPressOut: set({ pressed: false }),
            onHoverIn: set({ hovered: true }),
            onHoverOut: set({ hovered: false }),
            onFocus: set({ focused: true }),
            onBlur: set({ focused: false }),
          }
        : {}
    element = renderElement(
      host,
      mergeProps(
        handlers,
        nativeProps(part, slotProps, user),
        { ref: viewRef(part) },
        { ref }
      ),
      render,
      partState(part, slotProps) as PartState<P, S>,
      interaction
    )
  }
  if (provided === scope) {
    return element
  }
  return <context.Provider value={provided}>{element}</context.Provider>
}

const kindOf = (spec: PropSpec) => (typeof spec === "object" ? spec.kind : spec)

// Where a prop comes from when it's left out: the slot, and that slot's prop,
// which `"group.id"` names and `"item"` leaves to the prop's own name.
const fromOf = (spec: PropSpec, key: string) => {
  if (typeof spec !== "object") {
    return undefined
  }
  const [slot, prop = key] = spec.from.split(".")
  return { slot, prop }
}

// Splits a component's props into those the schema names and the host's own.
function split(props: Record<string, any>, schema: Record<string, PropSpec>) {
  const named: Record<string, any> = {}
  const rest: Record<string, any> = {}
  for (const key in props) {
    ;(key in schema && kindOf(schema[key]) ? named : rest)[key] = props[key]
  }
  return [named, rest] as const
}

// "tab-icon" is `TabIcon`.
type Pascal<Name extends string> = Name extends `${infer Head}-${infer Tail}`
  ? `${Capitalize<Head>}${Pascal<Tail>}`
  : Capitalize<Name>

const pascal = (name: string) =>
  name.replace(/(^|-)(\w)/g, (_, _dash, char: string) => char.toUpperCase())

type Host = React.ElementType

// A part's host props, without the ones its slot or options name.
type HostProps<H extends Host, State, Named> = Omit<
  PartProps<H, State>,
  keyof Named
>

type Props<Named, State, H extends Host> = Named & HostProps<H, State, Named>

type RootSlot<P extends Primitive> = "root" & SlotName<P>

type GenericOf<P> = P extends { generic?: infer G extends PrimitiveGeneric }
  ? G
  : never
type Applied<G, T, U> = G & { T: T; U: U }
type DefaultOf<G extends PrimitiveGeneric, K extends "T" | "U"> = G extends {
  defaults: Record<K, infer D>
}
  ? D & G[K]
  : G[K]
type OptionsIn<P extends Primitive, A> = Native<
  [A] extends [never]
    ? OptionsOf<P>
    : A extends { options: infer O }
      ? O
      : OptionsOf<P>
>
type StateIn<P extends Primitive, S extends SlotName<P>, A> = [A] extends [
  never,
]
  ? StateOf<P, S>
  : A extends { state: Record<S, infer State> }
    ? State
    : StateOf<P, S>
type PropsIn<P extends Primitive, S extends SlotName<P>, A> = Native<
  [A] extends [never]
    ? PropsOf<P, S>
    : A extends { props: Record<S, infer Named> }
      ? Named
      : PropsOf<P, S>
>

type RootOf<P extends Primitive, H extends Host | undefined> = [
  GenericOf<P>,
] extends [never]
  ? (props: RootPropsIn<P, never, H>) => React.ReactElement | null
  : <
      A extends GenericOf<P>["T"] = DefaultOf<GenericOf<P>, "T">,
      B extends GenericOf<P>["U"] = DefaultOf<GenericOf<P>, "U">,
    >(
      props: RootPropsIn<P, Applied<GenericOf<P>, A, B>, H>
    ) => React.ReactElement | null
type RootPropsIn<
  P extends Primitive,
  A,
  H extends Host | undefined,
> = H extends Host
  ? Props<
      OptionsIn<P, A> & PropsIn<P, RootSlot<P>, A>,
      StateIn<P, RootSlot<P>, A>,
      H
    >
  : OptionsIn<P, A> & { children?: React.ReactNode }

type PartOf<P extends Primitive, S extends SlotName<P>, H extends Host> = [
  GenericOf<P>,
] extends [never]
  ? PartComponent<P, S, H>
  : GenericOf<P> extends { props: Record<S, unknown> }
    ? GenericPartComponent<P, S, H>
    : PartComponent<P, S, H>

/**
 * A part's component, from `createParts`: the props of slot `S` of primitive
 * `P` rendered as the `react-native` host `H`.
 * @experimental
 */
interface PartComponent<
  P extends Primitive,
  S extends SlotName<P>,
  H extends Host,
> {
  (
    props: Props<
      Native<PropsOf<P, S>>,
      [GenericOf<P>] extends [never]
        ? StateOf<P, S>
        : StateIn<P, S, GenericOf<P>>,
      H
    >
  ): React.ReactElement | null
}

/**
 * A part's component whose props take the primitive's type parameter, like an
 * item's `value`, from `createParts`.
 * @experimental
 */
interface GenericPartComponent<
  P extends Primitive,
  S extends SlotName<P>,
  H extends Host,
> {
  <A extends GenericOf<P>["T"] = DefaultOf<GenericOf<P>, "T">>(
    props: Props<
      Native<
        (Applied<GenericOf<P>, A, unknown>["props"] & Record<S, unknown>)[S]
      >,
      StateIn<P, S, Applied<GenericOf<P>, A, unknown>>,
      H
    >
  ): React.ReactElement | null
}

/**
 * The components `createParts` makes: `Root`, and one per slot given a host, named in Pascal case.
 * @experimental
 */
type Parts<
  P extends Primitive,
  Hosts extends { [S in NativeSlot<P>]?: Host },
> = {
  Root: RootOf<P, Hosts extends { root: Host } ? Hosts["root"] : undefined>
} & {
  [
    S in NativeSlot<P> as S extends Exclude<keyof Hosts, "root">
      ? Pascal<S>
      : never
  ]: PartOf<P, S, Extract<Hosts[S & keyof Hosts], Host>>
}

/**
 * Every part of a primitive as a component, typed from it. `Root` makes the
 * instance from the primitive's options and shares it with the parts inside
 * it. Each slot named in `hosts` becomes a component that renders that
 * `react-native` host, named in Pascal case, like `TabIcon` for `tab-icon`.
 * Without a `root` host, `Root` renders only its children. Every part takes
 * `render`, and styles, class names and children that may be functions of its
 * state and interaction.
 *
 * @example
 * const { Root: Playlist, Track: PlaylistTrack } = createParts(playlist, { root: View, track: Pressable })
 * @experimental
 */
function createParts<
  P extends Primitive,
  Hosts extends { [S in NativeSlot<P>]?: Host },
>(
  primitive: P,
  hosts: Hosts & Record<Exclude<keyof Hosts, NativeSlot<P>>, never>
) {
  const schema = schemaOf(primitive)
  const { context, provides, keyed } = scopeOf(primitive)
  for (const [slot, props] of Object.entries(schema.slots)) {
    for (const key in props) {
      const from = fromOf(props[key], key)
      if (from) {
        provides.add(from.slot)
      }
      if (kindOf(props[key]) === "key") {
        keyed.add(slot)
      }
    }
  }
  const name = pascal(primitive.name ?? "")
  const parts: Record<string, (props: Record<string, any>) => React.ReactNode> =
    {}

  function Root(props: Record<string, any>) {
    const [options, rest] = split(props, schema.options)
    const handle = usePrimitive(
      primitive,
      options as Native<OptionsOf<P>>
    ) as unknown as PrimitiveHandle<Primitive>
    const { root } = hosts as { root?: Host }
    if (root) {
      const [slotProps, own] = split(rest, schema.slots.root ?? {})
      return usePart(handle, "root", slotProps, own, root)
    }
    return <HandleScope handle={handle}>{props.children}</HandleScope>
  }
  Root.displayName = name
  parts.Root = Root

  for (const [slot, host] of Object.entries(hosts as Record<string, Host>)) {
    if (slot === "root") {
      continue
    }
    const own = schema.slots[slot] ?? {}
    const ids = Object.keys(own).filter((key) => kindOf(own[key]) === "id")
    const key = Object.keys(own).find((key) => kindOf(own[key]) === "key")
    const Part = (props: Record<string, any>) => {
      const [slotProps, rest] = split(props, own)
      if (props.id !== undefined) {
        rest.id = props.id
      }
      // Unique ids for `id` props left out. Always made, so the hooks stay in order.
      for (const key of ids) {
        const id = React.useId()
        slotProps[key] ??= id
      }
      const scope = React.useContext(context)
      if (key) {
        slotProps.id ??= (
          scope?.handle.api as
            { internal: { keyOf: (value: unknown) => string } } | undefined
        )?.internal.keyOf(slotProps[key])
      }
      for (const prop in own) {
        const spec = own[prop]
        const from = fromOf(spec, prop)
        if (!from || slotProps[prop] !== undefined) {
          continue
        }
        const around = scope?.around[from.slot]
        if (!around && (spec as { required?: boolean }).required) {
          throw new Error(
            `<${Part.displayName}> must be used inside <${name}${pascal(from.slot)}>.`
          )
        }
        slotProps[prop] = around?.[from.prop]
      }
      return usePart(
        primitive,
        slot as NativeSlot<P>,
        slotProps as never,
        rest,
        host
      )
    }
    Part.displayName = name + pascal(slot)
    parts[pascal(slot)] = Part
  }
  return parts as unknown as Parts<P, Hosts>
}

export {
  createParts,
  type GenericPartComponent,
  type PartComponent,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useHandle,
  usePart,
  usePrimitive,
}

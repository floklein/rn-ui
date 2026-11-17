// A part reads its slot's declarative fields and delivers `press`. It never
// runs `bind`, `asleep`, `connect` or the `on` handlers, which need the DOM.
import type { NativeBehavior } from "@ui-sdk/core/native"
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
  createPresence,
  type PrimitiveGeneric,
  keep,
  liveAttrs,
  partState,
  type PresenceState,
  present,
  press,
  release,
  schemaOf,
  subscribe,
  unwatched,
  warn,
  withSource,
  yieldToAuthor,
} from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  AccessibilityInfo,
  I18nManager,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type AccessibilityActionEvent,
  type HostInstance,
} from "react-native"
import { carry } from "./carried-context"
import { mergeAccessibility, splitAria, toNativeProps } from "./accessibility"
import {
  idsOf,
  plainText,
  resolveIds,
  textOf,
  useReferences,
  useText,
} from "./names"
import {
  captures,
  parts as viewParts,
  pressSource,
  renders,
  isFollowed,
  letGo,
  responder,
  steps,
  textInputs,
  views,
} from "./native-host"
import {
  idle,
  mergeProps,
  renderElement,
  type Interaction,
  type RenderProp,
} from "./render-element"

type WebOnlyName = "container" | "shortcut" | "name" | "form" | "getHref"

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

const behaviors = new WeakMap<object, NativeBehavior>()

// A disabled FieldSet or Field around a component disables its controls, as
// a disabled <fieldset> does on the web. `owner` is the instance that provides it.
const DisabledContext = carry(
  "Disabled",
  React.createContext<{
    disabled: boolean
    owner: object
  } | null>(null)
)

// A Scroll Area's viewport stops its own scrolling while a drag inside it
// holds it, until the release `hold` returns runs.
const ScrollHoldContext = carry(
  "ScrollHold",
  React.createContext<(() => () => void) | null>(null)
)

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
 * `behavior` is the primitive's behavior on the native host, from
 * `@ui-sdk/core/native`, whose functions run while their parts are mounted.
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
  options: Native<OptionsOf<P>>,
  behavior?: NativeBehavior<TypesOf<P>["api"]>
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
  if (behavior) {
    behaviors.set(instance, behavior)
  }
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
      context: carry(
        `${primitive.name}Scope`,
        React.createContext<Scope | null>(null)
      ),
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

function useNearest<P extends Primitive>(primitive: P) {
  return React.useContext(scopeOf(primitive).context)?.handle as
    PrimitiveHandle<P> | undefined
}

/** The nearest instance of a primitive, for a part written by hand that calls its api. */
function useHandle<P extends Primitive>(primitive: P) {
  const handle = useNearest(primitive)
  if (!handle) {
    throw new Error(
      `The ${primitive.name} parts must be used inside their root.`
    )
  }
  return handle
}

/** The props of the part of `slot` around a part written by hand, like its item's value. */
const useAround = (primitive: Primitive, slot: string) =>
  React.useContext(scopeOf(primitive).context)?.around[slot]

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

const textInputRef = (view: HostInstance | null) => {
  if (view) {
    textInputs.add(view)
  }
}
const viewRefs = new WeakMap<Part, ViewRef>()

// Forgetting the view as it unmounts keeps a later focus request from asking.
// The slot's native behavior runs while the view is mounted, as `bind` does.
function viewRef(part: Part, behavior: NativeBehavior | undefined) {
  let ref = viewRefs.get(part)
  if (!ref) {
    ref = (view) => {
      if (view) {
        views.set(part, view)
        viewParts.set(view, part)
      }
      const cleanup = view ? behavior?.[part.slot]?.(part) : undefined
      return () => {
        cleanup?.()
        if (view) {
          viewParts.delete(view)
        }
        if (views.get(part) === view) {
          views.delete(part)
        }
      }
    }
    viewRefs.set(part, ref)
  }
  return ref
}

// As on the web, core's attribute wins only where it has a value, so
// `<Button role="link">` stays a link.
function ariaOf(
  part: Part,
  slotProps: object,
  aria: Record<string, string | undefined>,
  exiting: boolean
) {
  const own = yieldToAuthor(
    { ...attrs(part, slotProps), ...liveAttrs(part, slotProps) },
    (name) => aria[name] !== undefined
  )
  const merged = { ...own }
  for (const name in aria) {
    merged[name] ??= aria[name]
  }
  return {
    ...merged,
    // A part that animates out stays on screen, where its slot already hides it.
    ...(exiting && { inert: "", hidden: undefined }),
  }
}

// A label on a container would hide what's inside it from screen readers. A
// bar is read as one element, by VoiceOver and from TalkBack's description.
const isSingleElement = (
  host: React.ElementType,
  user: { accessible?: unknown },
  role: string | undefined
) =>
  user.accessible === undefined
    ? host === Pressable ||
      host === TextInput ||
      host === Text ||
      role === "progressbar" ||
      role === "meter"
    : user.accessible === true

function useMissingNames(
  ids: string[],
  from: { component: string; id: string }
) {
  const key = ids.join(" ")
  React.useEffect(() => {
    if (!key) {
      return
    }
    // Referenced parts mounted in the same commit register first.
    const timer = setTimeout(() => {
      for (const id of idsOf(key)) {
        if (textOf(id) === undefined) {
          warn(
            `\`aria-labelledby\` points at "${id}", which names nothing. Give the part with that id plain text children, or pass \`aria-label\`.`,
            from
          )
        }
      }
    })
    return () => clearTimeout(timer)
  }, [key, from.component, from.id])
}

// iOS has no live regions, so a live part's new text is announced, as
// Android's live region reads it.
function useLiveText(live: string | undefined, text: string | undefined) {
  const last = React.useRef(text)
  React.useEffect(() => {
    if (last.current === text) {
      return
    }
    last.current = text
    if (Platform.OS === "ios" && text && live && live !== "off") {
      AccessibilityInfo.announceForAccessibilityWithOptions(text, {
        queue: live === "polite",
      })
    }
  })
}

let rendered = 0

type OnExit = (done: () => void) => void

// A part animates in and out when its slot takes `keepMounted`.
type Animates<
  P extends Primitive,
  S extends SlotName<P>,
> = "keepMounted" extends keyof PropsOf<P, S> ? true : false

type PresenceOf<P extends Primitive, S extends SlotName<P>> =
  Animates<P, S> extends true ? PresenceState : {}

// A slot's state, or none for a slot that hands render functions nothing.
type PartState<
  P extends Primitive,
  S extends SlotName<P>,
> = (unknown extends StateOf<P, S> ? {} : StateOf<P, S>) & PresenceOf<P, S>

/**
 * The native-only prop of a part that animates out: `onExit`, called with
 * `done` when the part starts leaving. The part stays mounted, takes no input
 * and is hidden from accessibility until `done` is called or two seconds
 * pass. Without it, the part leaves at once.
 * @experimental
 */
type ExitProps = {
  /** Called with `done` when the part starts leaving. Call `done` once its exit animation ends. */
  onExit?: OnExit
}

type ExitPropsOf<P extends Primitive, S extends SlotName<P>> =
  Animates<P, S> extends true ? ExitProps : {}

const settled: PresenceState = { startingStyle: false, endingStyle: false }

// Follows whether the part is shown, as its slot's `present` says without
// `keepMounted`. The render that hides it already holds it for `onExit`.
function usePresence(
  part: Part,
  shown: boolean,
  onExit: OnExit | undefined,
  rerender: () => void
) {
  const current = React.useRef(part)
  current.current = part
  const [presence] = React.useState(() =>
    createPresence(rerender, () => current.current)
  )
  const was = React.useRef(shown)
  const exit = React.useRef(onExit)
  exit.current = onExit
  React.useLayoutEffect(() => {
    if (was.current === shown) {
      return
    }
    was.current = shown
    if (shown) {
      presence.enter()
    } else {
      presence.exit(exit.current)
    }
  })
  React.useEffect(() => presence.stop, [presence])
  if (was.current === shown) {
    const { exiting, startingStyle, endingStyle } = presence.get()
    return { exiting, state: { startingStyle, endingStyle } }
  }
  if (shown) {
    return { exiting: false, state: { ...settled, startingStyle: true } }
  }
  return { exiting: !!onExit, state: { ...settled, endingStyle: !!onExit } }
}

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
  } & ExitPropsOf<P, S> = {},
  Host?: React.ElementType
) {
  return usePressedPart(handle, slot, slotProps, props, Host)
}

// `usePart`, with the press a part delivers in place of its slot's, like a
// popup trigger's, which passes the opener its source stands for.
function usePressedPart<P extends Primitive, S extends NativeSlot<P>>(
  handle: P | PrimitiveHandle<P>,
  slot: S,
  slotProps: Native<PropsOf<P, S>> = {} as Native<PropsOf<P, S>>,
  props: Omit<PartProps<React.ElementType, PartState<P, S>>, "ref"> & {
    ref?: React.Ref<any>
  } & ExitPropsOf<P, S> = {},
  Host?: React.ElementType,
  pressOf?: (part: Part) => () => void
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
  const [changes, rerender] = React.useReducer((count: number) => count + 1, 0)
  const [interaction, setInteraction] = React.useState(idle)
  // A parent renders its children in tree order, so only a render it drives
  // restamps the part: one from the part's own state would move it last.
  const last = React.useRef<[number, Interaction]>(null)
  if (
    !last.current ||
    (last.current[0] === changes && last.current[1] === interaction)
  ) {
    renders.set(part, ++rendered)
  }
  last.current = [changes, interaction]
  React.useLayoutEffect(() => {
    commit(part, slotProps)
  })
  // A sibling's layout effect may change the state before this one subscribes.
  const snapshot = part.store.get()
  React.useLayoutEffect(() => {
    const unsubscribe = subscribe(part, rerender)
    if (part.store.get() !== snapshot) {
      rerender()
    }
    return unsubscribe
  }, [part])
  // What a fieldset watcher in `bind` writes on the web.
  const disabling = React.useContext(DisabledContext)
  const hold = React.useContext(ScrollHoldContext)
  React.useLayoutEffect(() => () => letGo(part), [part])
  // The native behavior runs as the view mounts, after this render.
  const follows = isFollowed(part)
  const captured = captures(part)
  React.useLayoutEffect(() => {
    if (isFollowed(part) !== follows || captures(part) !== captured) {
      rerender()
    }
  })
  React.useLayoutEffect(() => {
    const state = part.store.get() as { formDisabled?: boolean }
    if (
      disabling &&
      disabling.owner !== owner.instance &&
      state.formDisabled !== undefined &&
      state.formDisabled !== disabling.disabled
    ) {
      part.store.set({ formDisabled: disabling.disabled })
    }
  }, [disabling, part, owner])
  const animates = "keepMounted" in (schemaOf(primitive).slots[slot] ?? {})
  const { onExit, ...hostProps } = props as typeof props & ExitProps
  const slotState = partState(part, slotProps) as { open?: boolean }
  // `keepMounted` and `hiddenUntilFound` only keep a hidden part mounted. A
  // popup's content leaves as it closes: core keeps it mounted until it has.
  const presence = usePresence(
    part,
    animates &&
      slotState.open !== false &&
      present(part, {
        ...slotProps,
        keepMounted: false,
        hiddenUntilFound: false,
      }),
    onExit,
    rerender
  )

  const shown = present(part, slotProps) || presence.exiting
  const { render, ref, ...user } = hostProps
  const { aria, rest } = splitAria(user)
  const merged: Record<string, string | undefined> = shown
    ? ariaOf(part, slotProps, aria, presence.exiting)
    : {}
  const activate = shown
    ? pressOf
      ? pressOf(part)
      : press(part, slotProps)
    : undefined
  const host = Host ?? (activate ? Pressable : View)
  const single = shown && isSingleElement(host, rest, merged.role)
  const labelledBy = single ? idsOf(merged["aria-labelledby"]) : []
  useReferences([
    ...labelledBy,
    ...(single ? idsOf(merged["aria-describedby"]) : []),
  ])
  useMissingNames(labelledBy, {
    component: primitive.name,
    id: owner.instance.id,
  })
  const state = (
    animates ? { ...slotState, ...presence.state } : slotState
  ) as PartState<P, S>
  const translated = shown
    ? toNativeProps(
        merged,
        Platform.OS === "android" ? "android" : "ios",
        I18nManager.isRTL,
        single ? resolveIds : undefined,
        host === Pressable
      )
    : {}
  const content =
    typeof rest.children === "function"
      ? rest.children(state, interaction)
      : rest.children
  const text = shown && !render ? plainText(content) : undefined
  useText(
    shown
      ? (translated.nativeID ??
          (rest.nativeID as string | undefined) ??
          (rest.id as string | undefined))
      : undefined,
    text
  )
  useLiveText(
    merged["aria-live"],
    shown && merged["aria-live"] ? plainText(content, true) : undefined
  )

  let element: React.ReactElement | null = null
  if (shown) {
    const set = (change: Partial<Interaction>) => () =>
      setInteraction((current) => ({ ...current, ...change }))
    const pressable = activate || host === Pressable
    const handlers = pressable
      ? {
          onPress:
            activate &&
            !presence.exiting &&
            (() => withSource(pressSource(), activate)),
          onPressIn: set({ pressed: true }),
          onPressOut: set({ pressed: false }),
          onHoverIn: set({ hovered: true }),
          onHoverOut: set({ hovered: false }),
          onFocus: set({ focused: true }),
          onBlur: set({ focused: false }),
        }
      : {}
    const own = mergeProps(
      translated,
      { ...rest, children: content },
      mergeAccessibility(translated, rest)
    )
    const actions =
      !presence.exiting && own.accessibilityActions
        ? {
            onAccessibilityAction: (event: AccessibilityActionEvent) => {
              const { actionName } = event.nativeEvent
              const step = steps.get(part)
              if (
                step &&
                (actionName === "increment" || actionName === "decrement")
              ) {
                withSource("virtual", () =>
                  step(actionName === "increment" ? 1 : -1)
                )
                return
              }
              const expanded =
                attrs(part, slotProps)["aria-expanded"] === "true"
              if (
                activate &&
                ((actionName === "expand" && !expanded) ||
                  (actionName === "collapse" && expanded))
              ) {
                withSource("virtual", activate)
              }
            },
          }
        : {}
    // Core keeps an aria-disabled part focusable and refuses its press, but
    // Pressability reads only `disabled`: without it the part shows feedback.
    const disabled = pressable && own.accessibilityState?.disabled === true
    const { role } = merged
    // Fabric flattens a view with only a role or a label, and Android then
    // orders keyboard Tab by its children's edges across the whole screen.
    const container =
      !pressable &&
      ((role && role !== "none" && role !== "presentation") ||
        own.accessibilityRole ||
        own.accessibilityLabel)
        ? { collapsable: false }
        : {}
    // A part the web drags with a pointer follows touches with the responder,
    // and so does one its native behavior follows, like a list holding its items' drags.
    const slots = primitive.slots as
      Record<string, { on?: object } | undefined> | undefined
    const drags =
      !pressable &&
      ((slots?.[slot]?.on && "pointerdown" in slots[slot].on) || follows)
        ? {
            ...responder(part, hold),
            ...(captured && { pointerEvents: "box-only" as const }),
          }
        : {}
    element = renderElement(
      host,
      mergeProps(
        handlers,
        drags,
        actions,
        disabled ? { disabled } : {},
        container,
        own,
        { ref: viewRef(part, behaviors.get(owner.instance)) },
        host === TextInput ? { ref: textInputRef } : {},
        { ref }
      ),
      render,
      state,
      disabled
        ? { ...interaction, pressed: false, hovered: false }
        : interaction
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
      Native<PropsOf<P, S>> & ExitPropsOf<P, S>,
      ([GenericOf<P>] extends [never]
        ? StateOf<P, S>
        : StateIn<P, S, GenericOf<P>>) &
        PresenceOf<P, S>,
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
      > &
        ExitPropsOf<P, S>,
      StateIn<P, S, Applied<GenericOf<P>, A, unknown>> & PresenceOf<P, S>,
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
 * state and interaction. `behavior` is the primitive's behavior on the native
 * host, from `@ui-sdk/core/native`, whose functions run while their parts
 * are mounted.
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
  hosts: Hosts & Record<Exclude<keyof Hosts, NativeSlot<P>>, never>,
  behavior?: NativeBehavior<TypesOf<P>["api"]>
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
      options as Native<OptionsOf<P>>,
      behavior
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
  DisabledContext,
  HandleScope,
  ScrollHoldContext,
  type ExitProps,
  type GenericPartComponent,
  type PartComponent,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useAround,
  useHandle,
  useNearest,
  usePart,
  usePressedPart,
  usePrimitive,
}

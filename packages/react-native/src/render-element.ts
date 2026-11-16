import * as React from "react"

/**
 * Whether a part is pressed, hovered or focused, as React Native reports it on
 * a `Pressable`. `style`, `className` and `children` functions get it after
 * the part's state, and a `render` function as its third argument.
 * @experimental
 */
type Interaction = {
  /** Whether a touch is holding the part down. */
  pressed: boolean
  /** Whether a pointer rests on the part, on a device that reports one. */
  hovered: boolean
  /** Whether the OS reports the part focused, as during keyboard traversal. */
  focused: boolean
}

const idle: Interaction = { pressed: false, hovered: false, focused: false }

function prevented(event: unknown) {
  return !!(
    event as { isDefaultPrevented?: () => boolean } | undefined
  )?.isDefaultPrevented?.()
}

/**
 * Later props win, except where they combine: a className joins, styles
 * become an array in order, never flattened, refs merge, and both handlers
 * run, the later one first, which can call preventDefault() to skip the
 * earlier. Undefined never replaces a value.
 * @experimental
 */
function mergeProps(...sources: Record<string, any>[]) {
  const result: Record<string, any> = {}
  for (const source of sources) {
    for (const key in source) {
      const value = source[key]
      if (value === undefined) {
        continue
      }
      const earlier = result[key]
      if (earlier === undefined) {
        result[key] = value
      } else if (
        key === "className" &&
        typeof earlier === "string" &&
        typeof value === "string"
      ) {
        result.className = `${earlier} ${value}`
      } else if (key === "style") {
        result.style = [earlier, value]
      } else if (key === "ref") {
        result.ref = mergeRefs(earlier, value)
      } else if (
        /^on[A-Z]/.test(key) &&
        typeof earlier === "function" &&
        typeof value === "function"
      ) {
        result[key] = (...args: unknown[]) => {
          value(...args)
          if (!prevented(args[0])) {
            earlier(...args)
          }
        }
      } else {
        result[key] = value
      }
    }
  }
  return result
}

const mergedRefs = new WeakMap<
  object,
  WeakMap<object, (instance: unknown) => () => void>
>()

function setRef(ref: React.Ref<unknown>, instance: unknown) {
  if (typeof ref === "function") {
    return ref(instance)
  }
  if (ref) {
    ;(ref as React.RefObject<unknown>).current = instance
  }
}

// Stable for the same pair, so React doesn't detach and reattach.
function mergeRefs(a: React.Ref<unknown>, b: React.Ref<unknown>) {
  let inner = mergedRefs.get(a as object)
  if (!inner) {
    mergedRefs.set(a as object, (inner = new WeakMap()))
  }
  let merged = inner.get(b as object)
  if (!merged) {
    merged = (instance: unknown) => {
      const cleanups = [setRef(a, instance), setRef(b, instance)]
      return () =>
        cleanups.forEach((cleanup, index) =>
          typeof cleanup === "function"
            ? cleanup()
            : setRef(index ? b : a, null)
        )
    }
    inner.set(b as object, merged)
  }
  return merged
}

/**
 * A part's `render` prop: an element that receives the part's props, or a
 * function of the props, the part's state and its interaction that returns one.
 * @experimental
 */
type RenderProp<State = {}> =
  | React.ReactElement<Record<string, any>>
  | ((
      props: Record<string, any>,
      state: State,
      interaction: Interaction
    ) => React.ReactElement)

const resolve = (value: unknown, state: unknown, interaction: Interaction) =>
  typeof value === "function" ? value(state, interaction) : value

// Merged styles nest, and any level may hold a function of state.
function resolveStyle(
  style: unknown,
  state: unknown,
  interaction: Interaction
) {
  const resolved = resolve(style, state, interaction)
  if (!Array.isArray(resolved)) {
    return resolved
  }
  const entries: unknown[] = []
  for (const entry of resolved) {
    entries.push(resolveStyle(entry, state, interaction))
  }
  return entries
}

/**
 * Renders a `react-native` host, or the element or function passed as
 * `render`, which gets the props. Style, class name and children functions
 * resolve against `state` and `interaction`, so a host never receives one.
 * Parts of a primitive use `createParts` or `usePart`.
 *
 * @example
 * function Card({ render, ...props }: PartProps<typeof View>) {
 *   return renderElement(View, props, render)
 * }
 * @experimental
 */
function renderElement<State>(
  host: React.ElementType,
  props: Record<string, any>,
  render?: RenderProp<State>,
  state: State = {} as State,
  interaction: Interaction = idle
) {
  const resolved = { ...props }
  for (const key of ["className", "children"] as const) {
    if (typeof props[key] === "function") {
      resolved[key] = props[key](state, interaction)
    }
  }
  if (props.style !== undefined) {
    resolved.style = resolveStyle(props.style, state, interaction)
  }
  if (typeof render === "function") {
    return render(resolved, state, interaction)
  }
  if (render) {
    // The element's own props merge in: its handlers run before the part's.
    return React.cloneElement(
      render,
      mergeProps(resolved, render.props as Record<string, any>)
    )
  }
  return React.createElement(host, resolved)
}

type StateProps<State> = {
  style?: unknown
  className?: unknown
  children?: unknown
  render?: RenderProp<State>
}

/**
 * A part's `style`, `className`, `children` and `render`, with their
 * functions handed the fields `more` adds to the part's state, for a part
 * written by hand whose state holds what the adapter measured.
 */
function withState<State, More>(
  props: StateProps<State & More>,
  more: (state: State) => More
) {
  const wrap = (value: unknown) => (state: State, interaction: Interaction) =>
    (value as (state: State & More, interaction: Interaction) => unknown)(
      { ...state, ...more(state) },
      interaction
    )
  const { style, className, children, render } = props
  // Typed as the part takes them, which hands them its own state.
  return {
    style: (typeof style === "function" ? wrap(style) : style) as any,
    className: (typeof className === "function"
      ? wrap(className)
      : className) as any,
    children: (typeof children === "function"
      ? wrap(children)
      : children) as any,
    render:
      typeof render === "function"
        ? (
            props: Record<string, any>,
            state: State,
            interaction: Interaction
          ) => render(props, { ...state, ...more(state) }, interaction)
        : (render as RenderProp<State> | undefined),
  }
}

export {
  idle,
  type Interaction,
  mergeProps,
  renderElement,
  type RenderProp,
  withState,
}

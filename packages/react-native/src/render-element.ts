// PROTOTYPE (issue #14). Renders a host with no primitive behind it, and
// merges props, as `@ui-sdk/react`'s module of the same name does.
import * as React from "react"

/**
 * Whether a part is pressed, hovered or focused, named as React Native names
 * them. `style`, `className` and `children` functions get it after the state,
 * and `render` as its third argument.
 * @experimental
 */
type Interaction = { pressed: boolean; hovered: boolean; focused: boolean }

const idle: Interaction = { pressed: false, hovered: false, focused: false }

/**
 * A part's `render` prop: an element that receives the part's props, or a
 * function of the props, the part's state and its interaction.
 * @experimental
 */
type RenderProp<State = {}> =
  | React.ReactElement<Record<string, any>>
  | ((
      props: Record<string, any>,
      state: State,
      interaction: Interaction
    ) => React.ReactElement)

/**
 * Later props win, except where they combine: styles become an array in
 * order, never flattened, and both handlers run, the later one first.
 * Undefined never replaces a value.
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
      if (key === "style" && earlier) {
        result.style = [earlier, value]
      } else if (
        /^on[A-Z]/.test(key) &&
        typeof earlier === "function" &&
        typeof value === "function"
      ) {
        result[key] = (...args: unknown[]) => {
          value(...args)
          earlier(...args)
        }
      } else {
        result[key] = value
      }
    }
  }
  return result
}

const resolve = (value: unknown, state: unknown, interaction: Interaction) =>
  typeof value === "function" ? value(state, interaction) : value

// A style array may hold functions of state, from a user's `style` merged
// with the part's own, so a host view never receives one.
function resolveStyle(
  style: unknown,
  state: unknown,
  interaction: Interaction
) {
  return Array.isArray(style)
    ? style.map((entry) => resolve(entry, state, interaction))
    : resolve(style, state, interaction)
}

/**
 * Renders a `react-native` host, or the element or function passed as
 * `render`, which gets the props. Style, class name and children functions
 * resolve against `state` and `interaction`.
 * @experimental
 */
function renderElement<State>(
  host: React.ElementType,
  props: Record<string, any>,
  render?: RenderProp<State>,
  state: State = {} as State,
  interaction: Interaction = idle
) {
  const resolved = {
    ...props,
    style: resolveStyle(props.style, state, interaction),
    className: resolve(props.className, state, interaction),
    children: resolve(props.children, state, interaction),
  }
  if (typeof render === "function") {
    return render(resolved, state, interaction)
  }
  if (render) {
    return React.cloneElement(render, mergeProps(render.props, resolved))
  }
  return React.createElement(host, resolved)
}

export { type Interaction, mergeProps, renderElement, type RenderProp }

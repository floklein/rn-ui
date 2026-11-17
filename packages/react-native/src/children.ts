import * as React from "react"
import { carry } from "./carried-context"

// Whether an element of this type is among the children, at any depth the
// markup shows: a root that renders its own content part when the app gives
// none checks here, so a placed part never renders a second one.
function hasChild(children: React.ReactNode, type: React.ElementType) {
  for (const child of React.Children.toArray(children)) {
    if (
      React.isValidElement<{ children?: React.ReactNode }>(child) &&
      (child.type === type || hasChild(child.props.children, type))
    ) {
      return true
    }
  }
  return false
}

// Where a root's content part says it's there, for one inside a component of
// the app's own that `hasChild` can't see.
const PlacedContext = carry(
  "Placed",
  React.createContext<(() => () => void) | null>(null)
)

function usePlacedContent(wanted: boolean) {
  const [count, setCount] = React.useState(0)
  const register = React.useCallback(() => {
    setCount((count) => count + 1)
    return () => setCount((count) => count - 1)
  }, [])
  return [count > 0, wanted ? register : null] as const
}

const Placed = PlacedContext.Provider

function usePlaceContent() {
  const register = React.useContext(PlacedContext)
  React.useLayoutEffect(() => register?.(), [register])
}

const notLabelKey = Symbol.for("ui-sdk.not-label")

/** Marks a part inside an item that isn't its label, like an icon. */
function notLabel<Part extends object>(part: Part) {
  ;(part as Record<symbol, boolean>)[notLabelKey] = true
  return part
}

/**
 * The text an item reads as, without hidden parts and parts marked with
 * `notLabel`, like its indicator, whitespace collapsed. Empty when its
 * content is a function.
 */
// check-code: allow return-type recursive, so TypeScript cannot infer it.
function labelText(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(labelText).join("")
  }
  if (
    !React.isValidElement<Record<string, unknown>>(node) ||
    (node.type as unknown as Record<symbol, boolean>)[notLabelKey] ||
    node.props["aria-hidden"] === true ||
    node.props["aria-hidden"] === "true"
  ) {
    return ""
  }
  return labelText(node.props.children)
}

const itemLabel = (label: string | undefined, children: unknown) =>
  label ?? labelText(children).replace(/\s+/g, " ").trim()

/**
 * Tells a listbox the labels of its value from the items among `children`,
 * so the value shows the label before the list has ever opened. Items a
 * component renders from elsewhere aren't found.
 */
function learnLabels(
  internal: {
    keyOf: (value: unknown) => string
    learnLabels: (
      find: (keys: ReadonlySet<string>) => { value: unknown; label: string }[]
    ) => void
  },
  children: React.ReactNode
) {
  internal.learnLabels((keys) => {
    const found: { value: unknown; label: string }[] = []
    const visit = (node: React.ReactNode) => {
      if (Array.isArray(node)) {
        return node.forEach(visit)
      }
      if (!React.isValidElement<Record<string, unknown>>(node)) {
        return
      }
      const { value, label, children } = node.props
      if (
        value === undefined ||
        typeof node.type === "string" ||
        !keys.has(internal.keyOf(value))
      ) {
        return visit(children as React.ReactNode)
      }
      const shown = itemLabel(label as string | undefined, children)
      if (shown) {
        found.push({ value, label: shown })
      }
    }
    visit(children)
    return found
  })
}

export {
  hasChild,
  itemLabel,
  learnLabels,
  notLabel,
  Placed,
  usePlaceContent,
  usePlacedContent,
}

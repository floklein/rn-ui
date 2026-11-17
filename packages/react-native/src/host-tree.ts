import type { Part } from "@ui-sdk/core"
import { nativeHost, setNativeHost } from "@ui-sdk/core/native"

/**
 * A rendered host view as a test renderer exposes it: React Native
 * Testing Library's `screen.container`, or any node of the same shape. The
 * checks read it again after each action, so pass a live node.
 * @experimental
 */
type HostNode = {
  /** The host component's name, like `"View"` or `"Text"`. */
  type: string
  /** The props the host view received. */
  props: Record<string, any>
  /** The views and strings inside it. */
  children: readonly (HostNode | string)[] | null
}

/**
 * The OS whose accessibility a check reads: actions, and how content is
 * hidden, differ between them.
 * @experimental
 */
type OS = "ios" | "android"

/**
 * Runs an action that updates React state, like React Native Testing
 * Library's `act`. The checks take it as an option so they import no renderer.
 * @experimental
 */
type Act = (run: () => void) => unknown

/**
 * What every native check takes.
 * @experimental
 */
type CheckOptions = {
  /** The OS the tree was rendered for, as `Platform.OS` says. */
  os: OS
  /** Wraps each action, so its updates are rendered before the next read. */
  act?: Act
}

// `back` is Android's, which a `Modal` hears through `onRequestClose`.
type Action =
  | "activate"
  | "escape"
  | "back"
  | "expand"
  | "collapse"
  | "increment"
  | "decrement"

const settle: Act = async (run) => {
  run()
  await Promise.resolve()
}

// check-code: allow return-type recursive, so TypeScript cannot infer it.
function isDisplayNone(style: unknown): boolean {
  if (Array.isArray(style)) {
    return style.some(isDisplayNone)
  }
  return (style as { display?: string } | undefined)?.display === "none"
}

const hiddenOn = (node: HostNode, os: OS) =>
  os === "ios"
    ? node.props.accessibilityElementsHidden === true
    : node.props.importantForAccessibility === "no-hide-descendants"

const otherOS = (os: OS) => (os === "ios" ? "android" : "ios")

// Text and text fields are accessible elements unless they say otherwise.
// TalkBack reads a named image by its description, and a bar by its value
// text or, without one, the text inside it, though neither is a Tab stop.
const isAccessible = (node: HostNode, os: OS) =>
  node.props.accessible === true ||
  ((node.type === "Text" || node.type === "TextInput") &&
    node.props.accessible !== false) ||
  (os === "android" &&
    roleOf(node) === "image" &&
    !!node.props.accessibilityLabel) ||
  (os === "android" &&
    roleOf(node) === "progressbar" &&
    !!(
      node.props.accessibilityLabel ||
      node.props.accessibilityValue?.text ||
      textOf(node)
    ))

/**
 * Every accessible element outside hidden content, in tree order, every node
 * a screen reader could read, `shown`, and the problems met finding them.
 */
function readTree(root: HostNode, os: OS) {
  const elements: HostNode[] = []
  const shown: HostNode[] = []
  const problems: { node: HostNode; problem: string }[] = []
  const visit = (node: HostNode, inside: HostNode | undefined) => {
    if (isDisplayNone(node.props.style) || hiddenOn(node, os)) {
      return
    }
    shown.push(node)
    if (hiddenOn(node, otherOS(os))) {
      problems.push({
        node,
        problem: `is hidden on ${otherOS(os)} only, so the ${os} screen reader still reads it.`,
      })
    }
    let around = inside
    if (isAccessible(node, os)) {
      if (inside && node.props.accessible === true) {
        problems.push({
          node,
          problem: `is an accessible element inside ${describe(inside)}, which a screen reader reads as one element.`,
        })
      } else if (!inside) {
        elements.push(node)
        around = node
      }
    }
    for (const child of node.children ?? []) {
      if (typeof child !== "string") {
        visit(child, around)
      }
    }
  }
  visit(root, undefined)
  return { elements, shown, problems }
}

/** Every node on screen, in tree order, whether a screen reader reaches it or not. */
function shownNodes(root: HostNode) {
  const nodes: HostNode[] = []
  const visit = (node: HostNode) => {
    if (isDisplayNone(node.props.style)) {
      return
    }
    nodes.push(node)
    for (const child of node.children ?? []) {
      if (typeof child !== "string") {
        visit(child)
      }
    }
  }
  visit(root)
  return nodes
}

// Both screen readers leave hidden views out of the text they gather.
// check-code: allow return-type recursive, so TypeScript cannot infer it.
function textOf(node: HostNode): string {
  return (node.children ?? [])
    .map((child) =>
      typeof child === "string"
        ? child
        : hiddenOn(child, "ios") || hiddenOn(child, "android")
          ? ""
          : textOf(child)
    )
    .join("")
}

const roleOf = (node: HostNode) =>
  (node.props.accessibilityRole ?? node.props.role) as string | undefined

const nameOf = (node: HostNode) =>
  (node.props.accessibilityLabel ?? textOf(node)).trim()

const stateOf = (node: HostNode) =>
  (node.props.accessibilityState ?? {}) as Record<string, unknown>

const actionsOf = (node: HostNode) =>
  ((node.props.accessibilityActions ?? []) as { name: string }[]).map(
    (action) => action.name
  )

function describe(node: HostNode) {
  const role = roleOf(node)
  const name = nameOf(node)
  return `the ${role ?? node.type}${name ? ` "${name}"` : ""}`
}

// A press with no accessibility action declared reaches `Pressable` through
// its `onClick`, which ignores an event whose target isn't the view itself.
function perform(node: HostNode, action: Action) {
  if (action === "escape") {
    node.props.onAccessibilityEscape?.()
  } else if (action === "back") {
    node.props.onRequestClose?.()
  } else if (actionsOf(node).includes(action)) {
    node.props.onAccessibilityAction?.({ nativeEvent: { actionName: action } })
  } else {
    const event = {
      nativeEvent: {},
      target: node,
      currentTarget: node,
      stopPropagation() {},
      preventDefault() {},
      isDefaultPrevented: () => false,
    }
    ;(node.props.onClick ?? node.props.onPress)?.(event)
  }
}

/** Performs an action and returns the parts core asked the host to focus meanwhile. */
async function performWatched(
  node: HostNode,
  action: Action,
  act: Act = settle
) {
  const host = nativeHost()
  const requests: Part[] = []
  setNativeHost({
    focus(part) {
      requests.push(part)
      host?.focus(part)
    },
    field: (part) => host?.field(part),
    announce: (text, priority) => host?.announce(text, priority),
    activate: (part) => host?.activate(part),
    compare: (a, b) => host?.compare(a, b) ?? 0,
    isRTL: () => host?.isRTL() ?? false,
    box: (part) => host?.box(part),
    follow: (part, drag) => host?.follow(part, drag) ?? (() => {}),
    adjustable: (part, step) => host?.adjustable(part, step) ?? (() => {}),
    listen: (input) => host?.listen(input) ?? (() => {}),
    seen: (part) => host?.seen(part),
  })
  try {
    await act(() => perform(node, action))
  } finally {
    setNativeHost(host)
  }
  return requests
}

export {
  type Act,
  type Action,
  actionsOf,
  type CheckOptions,
  describe,
  type HostNode,
  nameOf,
  type OS,
  performWatched,
  readTree,
  roleOf,
  shownNodes,
  stateOf,
  textOf,
}

import {
  type Action,
  actionsOf,
  type CheckOptions,
  describe,
  type HostNode,
  nameOf,
  performWatched,
  readTree,
  roleOf,
  stateOf,
} from "./host-tree"

type Direction = "ltr" | "rtl"

const actionsToCompare = (node: HostNode) =>
  (["activate", "increment", "decrement"] as const).filter((action) =>
    action === "activate"
      ? typeof (node.props.onClick ?? node.props.onPress) === "function"
      : actionsOf(node).includes(action)
  )

const exposed = (root: HostNode, options: CheckOptions) =>
  readTree(root, options.os)
    .elements.map(
      (node) =>
        `${roleOf(node) ?? node.type} "${nameOf(node)}" ${JSON.stringify(stateOf(node))} ${JSON.stringify(node.props.accessibilityValue ?? {})}`
    )
    .join(", ")

async function outcome(
  render: (direction: Direction) => HostNode | Promise<HostNode>,
  options: CheckOptions,
  direction: Direction,
  index: number,
  action: Action
) {
  const root = await render(direction)
  await performWatched(
    readTree(root, options.os).elements[index],
    action,
    options.act
  )
  return exposed(root, options)
}

/**
 * Renders a component left to right and right to left, performs each
 * accessibility action a screen reader user has on each element, and checks
 * both directions end with the same accessibility: React Native has one
 * direction for the whole app and no arrow keys, so an action such as a
 * slider's increment must mean the same either way. `render` renders the
 * component in that direction and returns its live host node. Throws one
 * error that lists every problem.
 *
 * @example
 * await checkDirection(async (direction) => {
 *   await render(<Slider />, { direction })
 *   return screen.container
 * }, { os: Platform.OS, act })
 *
 * @experimental
 */
async function checkDirection(
  render: (direction: Direction) => HostNode | Promise<HostNode>,
  options: CheckOptions
) {
  const problems: string[] = []
  const elements = readTree(await render("ltr"), options.os).elements
  for (const [index, node] of elements.entries()) {
    for (const action of actionsToCompare(node)) {
      const ltr = await outcome(render, options, "ltr", index, action)
      const rtl = await outcome(render, options, "rtl", index, action)
      if (rtl !== ltr) {
        problems.push(
          `after the ${action} action on ${describe(node)}, right to left leaves ${rtl}, where left to right leaves ${ltr}`
        )
      }
    }
  }
  if (problems.length) {
    throw new Error(
      `checkDirection found ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n- ${problems.join("\n- ")}`
    )
  }
}

export { checkDirection }

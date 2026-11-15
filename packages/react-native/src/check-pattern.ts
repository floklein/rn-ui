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

/**
 * A pattern the native check knows, by its WAI-ARIA Authoring Practices name.
 * @experimental
 */
type NativePattern = "switch"

function createContext(root: HostNode, options: CheckOptions) {
  const problems: string[] = []
  const elements = () => readTree(root, options.os).elements
  return {
    ...options,
    root,
    problems,
    problem: (node: HostNode, problem: string) =>
      problems.push(
        `${node === root ? "The tree" : describe(node)} ${problem}`
      ),
    elements,
    withRole: (role: string) =>
      elements().filter((node) => roleOf(node) === role),
  }
}

type Context = ReturnType<typeof createContext>

const isDisabled = (node: HostNode) =>
  stateOf(node).disabled === true || node.props.disabled === true

function requireName(context: Context, node: HostNode, role: string) {
  if (!nameOf(node)) {
    context.problem(
      node,
      `has no name; a ${role} needs an accessibilityLabel or text inside it.`
    )
  }
}

// Each control is found again after a press by its place among its role's.
async function checkActivationToggles(
  context: Context,
  role: string,
  index: number,
  read: (node: HostNode) => unknown
) {
  const control = () => context.withRole(role)[index]
  const before = read(control())
  await performWatched(control(), "activate", context.act)
  const after = read(control())
  if (after === before) {
    context.problem(
      control(),
      `stays ${String(before)} after the activate action; activating a ${role} toggles it.`
    )
    return
  }
  await performWatched(control(), "activate", context.act)
}

async function switchPattern(context: Context) {
  const switches = context.withRole("switch")
  if (!switches.length) {
    context.problem(
      context.root,
      "has no element with the switch role, so it isn't a switch (APG switch)."
    )
    return
  }
  for (const control of switches) {
    requireName(context, control, "switch")
    if (typeof stateOf(control).checked !== "boolean") {
      context.problem(
        control,
        "has no checked state; a switch is on, true, or off, false (APG switch)."
      )
    }
  }
  for (const [index, control] of switches.entries()) {
    if (!isDisabled(control)) {
      await checkActivationToggles(
        context,
        "switch",
        index,
        (node) => stateOf(node).checked
      )
    }
  }
}

const patterns: Record<NativePattern, (context: Context) => Promise<void>> = {
  switch: switchPattern,
}

// The actions each OS's screen reader offers past activation: VoiceOver's
// escape gesture on iOS, TalkBack's expand and collapse on Android.
const osActions = { ios: ["escape"], android: ["expand", "collapse"] } as const

const hasAction = (node: HostNode, action: Action) =>
  action === "escape"
    ? typeof node.props.onAccessibilityEscape === "function"
    : actionsOf(node).includes(action)

async function checkActions(context: Context) {
  for (const action of osActions[context.os]) {
    const elements = context.elements()
    for (const node of elements.filter((node) => hasAction(node, action))) {
      if (isDisabled(node)) {
        continue
      }
      const index = context.elements().indexOf(node)
      const requests = await performWatched(node, action, context.act)
      const after = context.elements()[index]
      const outcome =
        action === "expand"
          ? stateOf(after ?? node).expanded === true
          : action === "collapse"
            ? stateOf(after ?? node).expanded === false
            : after !== node
      if (!outcome) {
        context.problem(
          node,
          action === "escape"
            ? "stays open after the escape action."
            : `isn't ${action}ed after the ${action} action.`
        )
      }
      if (!requests.length) {
        context.problem(
          node,
          `requests no accessibility focus after the ${action} action; opening and closing move the screen reader's focus.`
        )
      }
    }
  }
}

/**
 * Checks a rendered native widget against its WAI-ARIA pattern, as a screen
 * reader user meets it on `os`, and throws one error that lists every
 * problem, or returns nothing when there are none. `root` is a live host
 * node, like React Native Testing Library's `screen.container`.
 *
 * It checks roles, required states, names, one accessible element per item
 * and hidden content, then performs the pattern's accessibility actions and
 * reads the state after each: activate everywhere, escape on iOS, expand and
 * collapse on Android. Opening and closing must request accessibility focus.
 * It imports no renderer: pass your renderer's `act` so each action renders.
 *
 * @example
 * await render(<Switch aria-label="Wi-Fi"><SwitchThumb /></Switch>)
 * await checkPattern(screen.container, "switch", { os: Platform.OS, act })
 *
 * @experimental
 */
async function checkPattern(
  root: HostNode,
  pattern: NativePattern,
  options: CheckOptions
) {
  const check = patterns[pattern]
  if (!check) {
    throw new Error(
      `checkPattern doesn't support "${pattern}" on native yet. It supports ${Object.keys(patterns).join(", ")}.`
    )
  }
  const context = createContext(root, options)
  for (const { node, problem } of readTree(root, options.os).problems) {
    context.problem(node, problem)
  }
  await check(context)
  await checkActions(context)
  const { problems } = context
  if (!problems.length) {
    return
  }
  const count = `${problems.length} problem${problems.length === 1 ? "" : "s"}`
  throw new Error(
    `checkPattern found ${count} with the ${pattern} pattern on ${options.os}:\n${problems.map((problem) => `- ${problem}`).join("\n")}`
  )
}

export { checkPattern, type NativePattern }

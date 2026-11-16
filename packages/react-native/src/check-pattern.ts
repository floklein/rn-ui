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
 * A pattern the native check knows, by its WAI-ARIA Authoring Practices name,
 * or by its role where the Practices have none, like `"img"`.
 * @experimental
 */
type NativePattern = "button" | "checkbox" | "img" | "radio-group" | "switch"

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
      `has no name; ${/^[aeiou]/.test(role) ? "an" : "a"} ${role} needs an accessibilityLabel or text inside it.`
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

// A toggle button is a button with a pressed state, which React Native
// exposes as the togglebutton role with a checked state.
async function buttonPattern(context: Context) {
  const buttons = context.withRole("button")
  const toggles = context.withRole("togglebutton")
  if (!buttons.length && !toggles.length) {
    context.problem(
      context.root,
      "has no element with the button role, so it isn't a button (APG button)."
    )
    return
  }
  for (const button of buttons) {
    requireName(context, button, "button")
  }
  for (const index of buttons.keys()) {
    const button = context.withRole("button")[index]
    if (!isDisabled(button)) {
      await performWatched(button, "activate", context.act)
    }
  }
  for (const [index, toggle] of toggles.entries()) {
    requireName(context, toggle, "togglebutton")
    if (typeof stateOf(toggle).checked !== "boolean") {
      context.problem(
        toggle,
        "has no pressed state; a toggle button's checked state is true or false (APG button)."
      )
    } else if (!isDisabled(toggle)) {
      await checkActivationToggles(
        context,
        "togglebutton",
        index,
        (node) => stateOf(node).checked
      )
    }
  }
}

async function checkboxPattern(context: Context) {
  const checkboxes = context.withRole("checkbox")
  if (!checkboxes.length) {
    context.problem(
      context.root,
      "has no element with the checkbox role, so it isn't a checkbox (APG checkbox)."
    )
    return
  }
  for (const control of checkboxes) {
    requireName(context, control, "checkbox")
    const { checked } = stateOf(control)
    if (typeof checked !== "boolean" && checked !== "mixed") {
      context.problem(
        control,
        'has no checked state; a checkbox is checked, true, unchecked, false, or partly checked, "mixed" (APG checkbox).'
      )
    }
  }
  for (const [index, control] of checkboxes.entries()) {
    if (!isDisabled(control)) {
      await checkActivationToggles(
        context,
        "checkbox",
        index,
        (node) => stateOf(node).checked
      )
    }
  }
}

// An image still loading or that failed is hidden, and its fallback is read.
async function imgPattern(context: Context) {
  const images = context.withRole("image")
  for (const image of images) {
    requireName(context, image, "image")
  }
  if (!images.length && !context.elements().some((node) => nameOf(node))) {
    context.problem(
      context.root,
      "has no image and no text, so a screen reader reads nothing."
    )
  }
}

// Activating a radio checks it and unchecks the one checked before.
async function radioGroupPattern(context: Context) {
  const radios = context.withRole("radio")
  if (!radios.length) {
    context.problem(
      context.root,
      "has no element with the radio role, so it isn't a radio group (APG radio group)."
    )
    return
  }
  for (const radio of radios) {
    requireName(context, radio, "radio")
    if (typeof stateOf(radio).checked !== "boolean") {
      context.problem(
        radio,
        "has no checked state; a radio is checked, true, or unchecked, false (APG radio group)."
      )
    }
  }
  const checked = radios.filter((radio) => stateOf(radio).checked === true)
  if (checked.length > 1) {
    context.problem(
      context.root,
      `has ${checked.length} checked radios; one is checked at most (APG radio group).`
    )
    return
  }
  const index = radios.findIndex(
    (radio) => stateOf(radio).checked === false && !isDisabled(radio)
  )
  if (index === -1) {
    return
  }
  await performWatched(radios[index], "activate", context.act)
  const after = context.withRole("radio")
  if (
    after[index] &&
    after.some(
      (radio, at) => (stateOf(radio).checked === true) !== (at === index)
    )
  ) {
    context.problem(
      after[index],
      "isn't the only checked radio after the activate action; activating a radio checks it and unchecks the others (APG radio group)."
    )
  }
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
  button: buttonPattern,
  checkbox: checkboxPattern,
  img: imgPattern,
  "radio-group": radioGroupPattern,
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

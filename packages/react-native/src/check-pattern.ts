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
  shownNodes,
  stateOf,
} from "./host-tree"

/**
 * A pattern the native check knows, by its WAI-ARIA Authoring Practices name,
 * or by its role where the Practices have none, like `"img"`. A meter has
 * the progressbar role on native, and must always have a value. Pass a
 * separator's own view as the root of `"separator"`, since nothing marks one,
 * and a pagination's for `"pagination"`, whose current page is any selected button.
 * @experimental
 */
type NativePattern =
  | "alertdialog"
  | "button"
  | "checkbox"
  | "dialog"
  | "disclosure"
  | "img"
  | "meter"
  | "pagination"
  | "progressbar"
  | "radio-group"
  | "separator"
  | "switch"
  | "tabs"
  | "textbox"

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

// Content inside the button is part of its name, not what it discloses.
function contentCount(context: Context, button: HostNode) {
  const own = new Set(shownNodes(button))
  return readTree(context.root, context.os).shown.filter(
    (node) => !own.has(node)
  ).length
}

async function checkContentFollows(
  context: Context,
  button: () => HostNode,
  action: Action
) {
  const expanded = stateOf(button()).expanded
  const before = contentCount(context, button())
  await performWatched(button(), action, context.act)
  if (stateOf(button()).expanded === expanded) {
    context.problem(
      button(),
      `stays ${expanded ? "expanded" : "collapsed"} after the ${action} action; it shows or hides its content (APG disclosure).`
    )
    return false
  }
  const after = contentCount(context, button())
  if (expanded ? after >= before : after <= before) {
    context.problem(
      button(),
      `${expanded ? "hides" : "shows"} no content after the ${action} action; its content follows its expanded state (APG disclosure).`
    )
    return false
  }
  return true
}

// Activating a disclosure's button shows or hides its content (APG
// disclosure). TalkBack offers expand or collapse from the expanded state
// alone, so on Android the button handles them too.
async function disclosurePattern(context: Context) {
  const buttons = () =>
    context
      .withRole("button")
      .filter((node) => typeof stateOf(node).expanded === "boolean")
  if (!buttons().length) {
    context.problem(
      context.root,
      "has no button with an expanded state, so it isn't a disclosure (APG disclosure)."
    )
    return
  }
  for (const button of buttons()) {
    requireName(context, button, "button")
  }
  for (const index of buttons().keys()) {
    const button = () => buttons()[index]
    if (isDisabled(button())) {
      continue
    }
    if (
      !(await checkContentFollows(context, button, "activate")) ||
      !(await checkContentFollows(context, button, "activate")) ||
      context.os !== "android"
    ) {
      continue
    }
    const actions: Action[] = stateOf(button()).expanded
      ? ["collapse", "expand"]
      : ["expand", "collapse"]
    for (const action of actions) {
      if (!actionsOf(button()).includes(action)) {
        context.problem(
          button(),
          `has no ${action} action; TalkBack offers it from the expanded state, and changes that state without the content following.`
        )
        break
      }
      if (!(await checkContentFollows(context, button, action))) {
        break
      }
    }
  }
}

// A modal dialog renders in a `Modal`, which isolates it for screen readers,
// and is named by its title, a header. Native has no dialog role.
function openDialog(context: Context) {
  const modal = shownNodes(context.root).find(
    (node) => node.type === "Modal" && node.props.visible !== false
  )
  const title =
    modal && shownNodes(modal).find((node) => roleOf(node) === "header")
  return modal && title ? { modal, title } : undefined
}

// Opening and closing move the screen reader's focus, and the dialog closes
// from a Close part and from back on Android, the escape gesture on iOS.
async function dialogPattern(context: Context, kind: string) {
  const buttons = context.withRole("button")
  for (const button of buttons) {
    requireName(context, button, "button")
  }
  let trigger: number | undefined
  for (const [index, button] of buttons.entries()) {
    if (isDisabled(button)) {
      continue
    }
    const requests = await performWatched(button, "activate", context.act)
    if (openDialog(context)) {
      trigger = index
      if (!requests.length) {
        context.problem(
          button,
          `requests no accessibility focus when it opens the ${kind}; the screen reader moves into it.`
        )
      }
      break
    }
  }
  const open = () => openDialog(context)
  const reopen = () =>
    performWatched(
      context.withRole("button")[trigger!],
      "activate",
      context.act
    )
  if (trigger === undefined) {
    context.problem(
      context.root,
      `has no button that opens a ${kind} in a Modal, named by its title with the header role.`
    )
    return
  }
  requireName(context, open()!.title, "title")
  const closes = async (label: string, run: () => Promise<unknown[]>) => {
    const requests = await run()
    if (open()) {
      context.problem(context.root, `stays open after ${label}.`)
      return
    }
    if (!requests.length) {
      context.problem(
        context.root,
        `requests no accessibility focus after ${label}; focus returns to the trigger.`
      )
    }
    await reopen()
  }
  const close = context
    .elements()
    .find(
      (node) =>
        roleOf(node) === "button" &&
        shownNodes(open()!.modal).includes(node) &&
        !isDisabled(node)
    )
  if (close) {
    await closes(`${describe(close)}'s activate action`, () =>
      performWatched(close, "activate", context.act)
    )
  }
  if (context.os === "android") {
    await closes("Android's back", () =>
      performWatched(open()!.modal, "back", context.act)
    )
    return
  }
  const escapable = shownNodes(open()!.modal).find(
    (node) => typeof node.props.onAccessibilityEscape === "function"
  )
  if (!escapable) {
    context.problem(
      open()!.modal,
      `has no view that takes VoiceOver's escape gesture, which closes the ${kind}.`
    )
    return
  }
  await closes("the escape action", () =>
    performWatched(escapable, "escape", context.act)
  )
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

// Pages and steps are buttons, and the current page is the one selected
// button, since neither OS has a current state.
async function paginationPattern(context: Context) {
  const buttons = () => context.withRole("button")
  const current = () =>
    buttons().filter((button) => stateOf(button).selected === true)
  if (!buttons().length) {
    context.problem(
      context.root,
      "has no element with the button role, so it has no pages."
    )
    return
  }
  for (const button of buttons()) {
    requireName(context, button, "button")
  }
  if (current().length !== 1) {
    context.problem(
      context.root,
      current().length
        ? `has ${current().length} selected pages; one page is current.`
        : "has no selected page; the current page is selected."
    )
    return
  }
  for (const index of buttons().keys()) {
    const button = buttons()[index]
    if (!button || isDisabled(button) || stateOf(button).selected === true) {
      continue
    }
    const [before] = current()
    await performWatched(button, "activate", context.act)
    const after = current()
    if (after.length !== 1 || after[0] === before) {
      context.problem(
        button,
        `leaves the current page "${nameOf(before)}" after the activate action; a page or a step that isn't disabled goes to another page.`
      )
    }
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

// Each tab is its own accessible element, reached by swiping, with no roving
// tab stop, so every tab on screen must be one.
async function tabsPattern(context: Context) {
  const shown = shownNodes(context.root)
  if (!shown.some((node) => roleOf(node) === "tablist")) {
    context.problem(
      context.root,
      "has no element with the tablist role, so it isn't tabs (APG tabs)."
    )
    return
  }
  const elements = context.elements()
  for (const tab of shown.filter((node) => roleOf(node) === "tab")) {
    if (!elements.includes(tab)) {
      context.problem(
        tab,
        "can't be reached; each tab is its own accessible element (APG tabs)."
      )
    }
  }
  const tabs = context.withRole("tab")
  for (const tab of tabs) {
    requireName(context, tab, "tab")
    if (typeof stateOf(tab).selected !== "boolean") {
      context.problem(
        tab,
        "has no selected state; the active tab is selected, true, and the others false (APG tabs)."
      )
    }
  }
  const selected = tabs.filter((tab) => stateOf(tab).selected === true)
  if (tabs.length && selected.length !== 1) {
    context.problem(
      context.root,
      selected.length
        ? `has ${selected.length} selected tabs; one tab is active (APG tabs).`
        : "has no selected tab; one tab is active (APG tabs)."
    )
  }
  for (const index of tabs.keys()) {
    const tab = context.withRole("tab")[index]
    if (isDisabled(tab) || stateOf(tab).selected === true) {
      continue
    }
    await performWatched(tab, "activate", context.act)
    const after = context.withRole("tab")
    if (stateOf(after[index]).selected !== true) {
      context.problem(
        after[index],
        "isn't selected after the activate action; activating a tab selects it (APG tabs)."
      )
    } else if (
      after.some(
        (other, at) => at !== index && stateOf(other).selected === true
      )
    ) {
      context.problem(
        after[index],
        "leaves another tab selected after the activate action; one tab is active (APG tabs)."
      )
    }
  }
}

// check-code: allow return-type recursive, so TypeScript cannot infer it.
function textFieldsIn(node: HostNode): HostNode[] {
  const inside = (node.children ?? []).flatMap((child) =>
    typeof child === "string" ? [] : textFieldsIn(child)
  )
  return node.type === "TextInput" ? [node, ...inside] : inside
}

async function textboxPattern(context: Context) {
  const fields = textFieldsIn(context.root)
  if (!fields.length) {
    context.problem(context.root, "has no text field, so it isn't a textbox.")
    return
  }
  const elements = context.elements()
  for (const field of fields) {
    if (!elements.includes(field)) {
      context.problem(
        field,
        "isn't an accessible element of its own, so a screen reader can't reach it to edit it."
      )
      continue
    }
    requireName(context, field, "text field")
    if (stateOf(field).disabled === true && field.props.editable !== false) {
      context.problem(
        field,
        "is disabled for the screen reader but can still be edited."
      )
    }
  }
}

// Neither platform has a separator role, so a separator is checked for what
// it must not be: an element read on its own, or a keyboard stop.
async function separatorPattern(context: Context) {
  for (const node of context.elements()) {
    context.problem(
      node,
      "is an element a screen reader stops on; a separator is structure, never read on its own."
    )
  }
  for (const node of shownNodes(context.root)) {
    const role = roleOf(node)
    if (role !== undefined && role !== "none") {
      context.problem(
        node,
        `has the ${role} role; a separator has no role on native, or "none".`
      )
    }
    if (node.props.focusable === true) {
      context.problem(
        node,
        "is a keyboard stop; a separator is never focusable."
      )
    }
  }
}

// Without value text, VoiceOver reads the value as a share of max minus min.
async function barPattern(context: Context, pattern: "progressbar" | "meter") {
  const bars = shownNodes(context.root).filter(
    (node) => roleOf(node) === "progressbar"
  )
  if (!bars.length) {
    context.problem(
      context.root,
      `has no element with the progressbar role, so it isn't a ${pattern}.`
    )
    return
  }
  const elements = context.elements()
  for (const bar of bars) {
    if (!elements.includes(bar)) {
      context.problem(
        bar,
        `isn't an accessible element; a screen reader reads a ${pattern} as one element with its value.`
      )
      continue
    }
    // Android's description is the value text alone, unless a label leads it.
    if (
      context.os === "android" &&
      bar.props.accessibilityValue?.text &&
      !bar.props.accessibilityLabel
    ) {
      context.problem(
        bar,
        `has no name on Android, where its description is its value alone; name a ${pattern} with a label part or aria-label.`
      )
    } else {
      requireName(context, bar, pattern)
    }
    if (
      bar.props.focusable === true ||
      (context.os === "android" && bar.props.accessible === true)
    ) {
      context.problem(
        bar,
        `is a keyboard stop; a ${pattern} is read, never focused.`
      )
    }
    const { min, max, now, text } = (bar.props.accessibilityValue ?? {}) as {
      min?: number
      max?: number
      now?: number
      text?: string
    }
    if (now === undefined) {
      if (pattern === "meter") {
        context.problem(bar, "has no current value; a meter always has one.")
      }
      continue
    }
    if (min !== undefined && max !== undefined && (now < min || now > max)) {
      context.problem(bar, `is ${now}, outside its range of ${min} to ${max}.`)
    }
    if (!text) {
      context.problem(
        bar,
        "has no value text, so VoiceOver reads its value as a fraction of its range."
      )
    }
  }
}

const patterns: Record<NativePattern, (context: Context) => Promise<void>> = {
  alertdialog: (context) => dialogPattern(context, "alert dialog"),
  button: buttonPattern,
  checkbox: checkboxPattern,
  dialog: (context) => dialogPattern(context, "dialog"),
  disclosure: disclosurePattern,
  img: imgPattern,
  meter: (context) => barPattern(context, "meter"),
  pagination: paginationPattern,
  progressbar: (context) => barPattern(context, "progressbar"),
  "radio-group": radioGroupPattern,
  separator: separatorPattern,
  switch: switchPattern,
  tabs: tabsPattern,
  textbox: textboxPattern,
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
      // A disclosure keeps focus on its button; a popup moves it in and back.
      if (action === "escape" && !requests.length) {
        context.problem(
          node,
          "requests no accessibility focus after the escape action; closing moves the screen reader's focus back."
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
 * collapse on Android. Escape must request accessibility focus.
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

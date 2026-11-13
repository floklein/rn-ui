// PROTOTYPE (issue #14). The one place core's attribute map becomes React
// Native props. Core's ARIA is the source vocabulary: accessibility comes out
// in `accessibility*` names only, never as `role` or `aria-*`.
import type { Attrs } from "@ui-sdk/core"
import type { AccessibilityRole, AccessibilityState } from "react-native"

const roles: Record<string, AccessibilityRole> = {
  alert: "alert",
  button: "button",
  checkbox: "checkbox",
  combobox: "combobox",
  grid: "grid",
  heading: "header",
  img: "image",
  link: "link",
  list: "list",
  menu: "menu",
  menubar: "menubar",
  menuitem: "menuitem",
  progressbar: "progressbar",
  radio: "radio",
  radiogroup: "radiogroup",
  search: "search",
  slider: "adjustable",
  spinbutton: "spinbutton",
  switch: "switch",
  tab: "tab",
  tablist: "tablist",
  timer: "timer",
  toolbar: "toolbar",
}

const states: Record<string, keyof AccessibilityState> = {
  "aria-busy": "busy",
  "aria-disabled": "disabled",
  "aria-expanded": "expanded",
  "aria-selected": "selected",
}

/**
 * Translates a part's attributes to props for a `react-native` host. `lost`
 * names the attributes that have no native counterpart, which is every
 * relationship but a label's on Android.
 */
function toNativeProps(attrs: Attrs) {
  const props: Record<string, unknown> = {}
  const state: AccessibilityState = {}
  const lost: string[] = []
  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined) {
      continue
    }
    if (name === "role") {
      const role = roles[value]
      if (role) {
        props.accessibilityRole = role
        props.accessible = true
      } else if (value === "presentation" || value === "none") {
        props.accessible = false
        props.importantForAccessibility = "no"
      } else {
        lost.push(`role=${value}`)
      }
    } else if (name === "type") {
      if (value === "button" && !attrs.role) {
        props.accessibilityRole = "button"
        props.accessible = true
      }
    } else if (name === "id") {
      props.nativeID = value
    } else if (name === "disabled") {
      props.disabled = true
      state.disabled = true
    } else if (name === "aria-checked") {
      state.checked = value === "mixed" ? "mixed" : value === "true"
    } else if (name in states) {
      state[states[name] as "busy"] = value === "true"
    } else if (name === "aria-label") {
      props.accessibilityLabel = value
    } else if (name === "aria-labelledby") {
      // Android only, and its first id only. VoiceOver ignores it.
      props.accessibilityLabelledBy = value.split(" ")
    } else if (name === "aria-modal") {
      props.accessibilityViewIsModal = value === "true"
    } else if (name === "aria-hidden" || name === "hidden") {
      props.accessibilityElementsHidden = true
      props.importantForAccessibility = "no-hide-descendants"
      if (name === "hidden") {
        props.style = { display: "none" }
      }
      // No roving `tabindex`: -1 would take a view out of Android's traversal.
    } else if (name !== "tabindex" && !name.startsWith("data-")) {
      lost.push(name)
    }
  }
  if (Object.keys(state).length) {
    props.accessibilityState = state
  }
  return { props, lost }
}

// A user's `role` and `aria-*` props go through the same translation, which
// consumes them. Their `accessibility*` props win over it field by field.
function splitUser(user: Record<string, unknown>) {
  const aria: Attrs = {}
  const rest: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(user)) {
    if (name === "role" || name.startsWith("aria-")) {
      aria[name] = value === undefined ? undefined : String(value)
    } else {
      rest[name] = value
    }
  }
  return { aria, rest }
}

function mergeAccessibility(
  translated: Record<string, unknown>,
  user: Record<string, unknown>
) {
  const state = {
    ...(translated.accessibilityState as object | undefined),
    ...(user.accessibilityState as object | undefined),
  }
  return Object.keys(state).length ? { accessibilityState: state } : {}
}

export { mergeAccessibility, splitUser, toNativeProps }

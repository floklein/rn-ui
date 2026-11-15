// The one place core's attribute map becomes React Native props, in
// `accessibility*` names only: React Native lets `role` override
// `accessibilityRole`, and reads only some `aria-*` props.
import type { Attrs } from "@ui-sdk/core"
import type {
  AccessibilityRole,
  AccessibilityState,
  AccessibilityValue,
} from "react-native"

type OS = "ios" | "android"

type NativeProps = {
  accessibilityRole?: AccessibilityRole
  accessibilityState?: AccessibilityState
  accessibilityValue?: AccessibilityValue
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityElementsHidden?: boolean
  accessibilityViewIsModal?: boolean
  accessibilityLiveRegion?: "none" | "polite" | "assertive"
  importantForAccessibility?: "no-hide-descendants"
  nativeID?: string
  disabled?: boolean
  pointerEvents?: "none"
  style?: { display: "none" }
}

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
  menuitemcheckbox: "checkbox",
  menuitemradio: "radio",
  meter: "progressbar",
  none: "none",
  option: "button",
  presentation: "none",
  progressbar: "progressbar",
  radio: "radio",
  radiogroup: "radiogroup",
  slider: "adjustable",
  spinbutton: "spinbutton",
  switch: "switch",
  tab: "tab",
  tablist: "tablist",
  toolbar: "toolbar",
  treegrid: "grid",
}

const states = {
  "aria-busy": "busy",
  "aria-disabled": "disabled",
  "aria-expanded": "expanded",
  "aria-selected": "selected",
} as const

const values = {
  "aria-valuenow": "now",
  "aria-valuemin": "min",
  "aria-valuemax": "max",
} as const

const checkedOf = (value: string) =>
  value === "mixed" ? value : value === "true"

function hide(props: NativeProps, os: OS) {
  if (os === "ios") {
    props.accessibilityElementsHidden = true
  } else {
    props.importantForAccessibility = "no-hide-descendants"
  }
}

/**
 * The props a `react-native` host takes for a part's attributes on `os`.
 * What has no native counterpart is left out, like `aria-controls`, and so
 * is `tabindex`, which would take a roving item out of Android's traversal.
 */
function toNativeProps(attrs: Attrs, os: OS) {
  const props: NativeProps = {}
  const state: AccessibilityState = {}
  const value: { min?: number; max?: number; now?: number; text?: string } = {}
  const role = attrs.role === undefined ? undefined : roles[attrs.role]
  if (role) {
    props.accessibilityRole =
      role === "button" && attrs["aria-pressed"] !== undefined
        ? "togglebutton"
        : role
  } else if (attrs.role === undefined && attrs.type === "button") {
    props.accessibilityRole = "button"
  }
  for (const [name, given] of Object.entries(attrs)) {
    // Android's view drops "busy" from what TalkBack reads only when a state
    // names busy, so a part that can be busy says it isn't.
    if (name === "aria-busy" && given === undefined && os === "android") {
      state.busy = false
    }
    if (given === undefined) {
      continue
    }
    if (name in states) {
      state[states[name as keyof typeof states]] = given === "true"
    } else if (name in values) {
      value[values[name as keyof typeof values]] = Number(given)
    } else if (name === "aria-checked" || name === "aria-pressed") {
      state.checked = checkedOf(given)
    } else if (name === "aria-valuetext") {
      value.text = given
    } else if (name === "aria-label") {
      props.accessibilityLabel = given
    } else if (name === "aria-description") {
      props.accessibilityHint = given
    } else if (name === "id") {
      props.nativeID = given
    } else if (name === "disabled") {
      props.disabled = true
      state.disabled = true
    } else if (name === "aria-hidden" && given === "true") {
      hide(props, os)
    } else if (name === "hidden") {
      hide(props, os)
      props.style = { display: "none" }
    } else if (name === "inert") {
      hide(props, os)
      props.pointerEvents = "none"
    } else if (name === "aria-modal" && given === "true" && os === "ios") {
      props.accessibilityViewIsModal = true
    } else if (name === "aria-live" && os === "android") {
      props.accessibilityLiveRegion =
        given === "off" ? "none" : (given as "polite")
    }
  }
  if (Object.keys(state).length) {
    props.accessibilityState = state
  }
  if (Object.keys(value).length) {
    props.accessibilityValue = value
  }
  return props
}

/** Splits a user's props into the `role` and `aria-*` the translation consumes, and the rest. */
function splitAria(props: Record<string, unknown>) {
  const aria: Attrs = {}
  const rest: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(props)) {
    if (name === "role" || name.startsWith("aria-")) {
      aria[name] =
        value === undefined || value === false ? undefined : String(value)
    } else {
      rest[name] = value
    }
  }
  return { aria, rest }
}

/** A user's `accessibilityState` and `accessibilityValue` win over the translation field by field. */
function mergeAccessibility(
  translated: NativeProps,
  user: Record<string, any>
) {
  const merged: Record<string, object> = {}
  for (const name of ["accessibilityState", "accessibilityValue"] as const) {
    if (translated[name] && user[name]) {
      merged[name] = { ...translated[name], ...user[name] }
    }
  }
  return merged
}

export {
  mergeAccessibility,
  type NativeProps,
  type OS,
  splitAria,
  toNativeProps,
}

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
  accessible?: boolean
  collapsable?: boolean
  focusable?: boolean
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
  style?: { display?: "none"; transform?: [{ scaleX: -1 }] }
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
 * An icon marked to mirror flips when the app runs right to left, `rtl`.
 */
function toNativeProps(attrs: Attrs, os: OS, rtl = false) {
  const props: NativeProps = {}
  const state: AccessibilityState = {}
  const value: { min?: number; max?: number; now?: number; text?: string } = {}
  const role =
    attrs.role === undefined
      ? attrs.type === "button"
        ? "button"
        : undefined
      : roles[attrs.role]
  if (role) {
    props.accessibilityRole =
      role === "button" && attrs["aria-pressed"] !== undefined
        ? "togglebutton"
        : role
  }
  // VoiceOver reads an image or a bar as one element. On Android `accessible`
  // would make it a Tab stop, and Fabric would flatten it away with its label.
  if (role === "image" || role === "progressbar") {
    if (os === "ios") {
      props.accessible = true
    } else {
      props.collapsable = false
    }
  }
  for (const [name, given] of Object.entries(attrs)) {
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
      // Out of Tab's order too: a Pressable stays focusable without `accessible`.
      if (attrs.tabindex === "-1") {
        props.accessible = false
        props.focusable = false
      }
    } else if (name === "hidden") {
      hide(props, os)
      props.style = { ...props.style, display: "none" }
    } else if (name === "data-mirror" && rtl) {
      props.style = { ...props.style, transform: [{ scaleX: -1 }] }
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
  // Android writes busy and mixed into the view's description, which hides
  // the text inside it and is rewritten only from a state that names busy. So
  // they go only on a part with its own label, which then always names busy.
  if (os === "android") {
    if (attrs["aria-label"] === undefined) {
      delete state.busy
      if (state.checked === "mixed") {
        state.checked = false
      }
    } else if ("aria-busy" in attrs || state.checked !== undefined) {
      state.busy ??= false
    }
  }
  // Android writes the value's text into the description and rewrites it only
  // from a value that has one, so a bar turning indeterminate sends it empty.
  if (os === "android" && role === "progressbar" && "aria-valuetext" in attrs) {
    value.text ??= ""
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

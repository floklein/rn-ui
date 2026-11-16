import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { toNativeProps, type OS } from "../src/accessibility"

const coreDir = path.join(__dirname, "../../core/src")
const coreSource = ["components", "foundation"]
  .flatMap((folder) =>
    readdirSync(path.join(coreDir, folder), { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".ts") && !file.endsWith(".native.ts"))
      .map((file) => readFileSync(path.join(coreDir, folder, file), "utf8"))
  )
  .join("\n")
const knownRoles = readFileSync(
  path.join(coreDir, "foundation/kernel/roles.ts"),
  "utf8"
)
  .split("] as const")[0]
  .match(/"[a-z]+"/g)!
  .map((role) => role.slice(1, -1))

// The HTML attributes a slot's `attrs` could hold. Those core's source names
// as a key are the ones the translation must cover.
const htmlAttributes =
  "accept alt autocapitalize autocomplete autocorrect capture checked cols contenteditable dir disabled draggable enterkeyhint for form height hidden href id inert inputmode label list loading low high max maxlength min minlength multiple name open pattern placeholder popover readonly required rows scope selected size sizes slot span spellcheck src start step style tabindex target title translate type value width".split(
    " "
  )

const emitted = {
  aria: [...new Set(coreSource.match(/"aria-[a-z]+"/g))].map((name) =>
    name.slice(1, -1)
  ),
  roles: knownRoles.filter((role) =>
    new RegExp(`role[^\\n]{0,60}"${role}"`).test(coreSource)
  ),
  html: htmlAttributes.filter((name) =>
    new RegExp(`(^|[^\\w.-])"?${name}"?: `, "m").test(coreSource)
  ),
}

const hiddenProps = {
  ios: { accessibilityElementsHidden: true },
  android: { importantForAccessibility: "no-hide-descendants" },
}

// Each row: the attributes, and the props they become on iOS and on Android.
const rows: [Record<string, string | undefined>, object, object][] = [
  [{ id: "a" }, { nativeID: "a" }, { nativeID: "a" }],
  [
    { disabled: "" },
    { disabled: true, accessibilityState: { disabled: true } },
    { disabled: true, accessibilityState: { disabled: true } },
  ],
  [
    { type: "button" },
    { accessibilityRole: "button" },
    { accessibilityRole: "button" },
  ],
  [{ type: "submit" }, {}, {}],
  [
    { role: "radio", type: "button" },
    { accessibilityRole: "radio" },
    { accessibilityRole: "radio" },
  ],
  [
    { hidden: "" },
    { ...hiddenProps.ios, style: { display: "none" } },
    { ...hiddenProps.android, style: { display: "none" } },
  ],
  [
    { hidden: "until-found" },
    { ...hiddenProps.ios, style: { display: "none" } },
    { ...hiddenProps.android, style: { display: "none" } },
  ],
  [
    { inert: "" },
    { ...hiddenProps.ios, pointerEvents: "none" },
    { ...hiddenProps.android, pointerEvents: "none" },
  ],
  [{ "aria-hidden": "true" }, hiddenProps.ios, hiddenProps.android],
  [{ "aria-hidden": "false" }, {}, {}],
  [
    { "aria-label": "Wi-Fi" },
    { accessibilityLabel: "Wi-Fi" },
    { accessibilityLabel: "Wi-Fi" },
  ],
  [
    { "aria-description": "Saves power" },
    { accessibilityHint: "Saves power" },
    { accessibilityHint: "Saves power" },
  ],
  [
    { "aria-disabled": "true" },
    { accessibilityState: { disabled: true } },
    { accessibilityState: { disabled: true } },
  ],
  [
    { "aria-disabled": "false" },
    { accessibilityState: { disabled: false } },
    { accessibilityState: { disabled: false } },
  ],
  [
    { "aria-checked": "true" },
    { accessibilityState: { checked: true } },
    { accessibilityState: { checked: true } },
  ],
  [
    { "aria-checked": "false" },
    { accessibilityState: { checked: false } },
    { accessibilityState: { checked: false } },
  ],
  [
    { "aria-checked": "mixed" },
    { accessibilityState: { checked: "mixed" } },
    { accessibilityState: { checked: "mixed" } },
  ],
  [
    { "aria-selected": "true" },
    { accessibilityState: { selected: true } },
    { accessibilityState: { selected: true } },
  ],
  [
    { "aria-expanded": "false" },
    { accessibilityState: { expanded: false } },
    { accessibilityState: { expanded: false } },
  ],
  [{ "aria-busy": "true" }, { accessibilityState: { busy: true } }, {}],
  [
    { "aria-busy": "true", "aria-label": "Save" },
    { accessibilityLabel: "Save", accessibilityState: { busy: true } },
    { accessibilityLabel: "Save", accessibilityState: { busy: true } },
  ],
  [
    { "aria-busy": undefined, "aria-label": "Save" },
    { accessibilityLabel: "Save" },
    { accessibilityLabel: "Save", accessibilityState: { busy: false } },
  ],
  [{ "aria-busy": undefined }, {}, {}],
  [
    { role: "button", "aria-pressed": "true" },
    {
      accessibilityRole: "togglebutton",
      accessibilityState: { checked: true },
    },
    {
      accessibilityRole: "togglebutton",
      accessibilityState: { checked: true },
    },
  ],
  [
    { type: "button", "aria-pressed": "false" },
    {
      accessibilityRole: "togglebutton",
      accessibilityState: { checked: false },
    },
    {
      accessibilityRole: "togglebutton",
      accessibilityState: { checked: false },
    },
  ],
  [
    { "aria-pressed": "mixed" },
    { accessibilityState: { checked: "mixed" } },
    { accessibilityState: { checked: "mixed" } },
  ],
  [
    {
      "aria-valuenow": "5",
      "aria-valuemin": "0",
      "aria-valuemax": "10",
      "aria-valuetext": "Half",
    },
    { accessibilityValue: { now: 5, min: 0, max: 10, text: "Half" } },
    { accessibilityValue: { now: 5, min: 0, max: 10, text: "Half" } },
  ],
  [{ "aria-modal": "true" }, { accessibilityViewIsModal: true }, {}],
  [{ "aria-modal": "false" }, {}, {}],
  [{ "aria-live": "polite" }, {}, { accessibilityLiveRegion: "polite" }],
  [{ "aria-live": "assertive" }, {}, { accessibilityLiveRegion: "assertive" }],
  [{ "aria-live": "off" }, {}, { accessibilityLiveRegion: "none" }],
  [{ tabindex: "-1" }, {}, {}],
  [{ tabindex: "0" }, {}, {}],
  [{ "data-slot": "switch", "data-checked": "" }, {}, {}],
]

// What has no React Native counterpart. `aria-labelledby` and
// `aria-describedby` resolve to text once names land, with Field.
const dropped = [
  "aria-activedescendant",
  "aria-atomic",
  "aria-autocomplete",
  "aria-colcount",
  "aria-colindex",
  "aria-colspan",
  "aria-controls",
  "aria-current",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-haspopup",
  "aria-invalid",
  "aria-keyshortcuts",
  "aria-labelledby",
  "aria-level",
  "aria-multiline",
  "aria-multiselectable",
  "aria-orientation",
  "aria-owns",
  "aria-placeholder",
  "aria-posinset",
  "aria-readonly",
  "aria-required",
  "aria-roledescription",
  "aria-rowcount",
  "aria-rowindex",
  "aria-rowspan",
  "aria-setsize",
  "aria-sort",
  ...emitted.html.filter(
    (name) =>
      !["id", "disabled", "type", "hidden", "inert", "tabindex"].includes(name)
  ),
]

const roles: Record<string, string | undefined> = {
  alert: "alert",
  alertdialog: undefined,
  article: undefined,
  button: "button",
  checkbox: "checkbox",
  columnheader: undefined,
  combobox: "combobox",
  dialog: undefined,
  feed: undefined,
  grid: "grid",
  gridcell: undefined,
  group: undefined,
  heading: "header",
  img: "image",
  link: "link",
  list: "list",
  listbox: undefined,
  listitem: undefined,
  log: undefined,
  menu: "menu",
  menubar: "menubar",
  menuitem: "menuitem",
  menuitemcheckbox: "checkbox",
  menuitemradio: "radio",
  meter: "progressbar",
  navigation: undefined,
  none: "none",
  option: "button",
  presentation: "none",
  progressbar: "progressbar",
  radio: "radio",
  radiogroup: "radiogroup",
  region: undefined,
  row: undefined,
  rowheader: undefined,
  separator: undefined,
  slider: "adjustable",
  spinbutton: "spinbutton",
  status: undefined,
  switch: "switch",
  tab: "tab",
  tablist: "tablist",
  tabpanel: undefined,
  textbox: undefined,
  toolbar: "toolbar",
  tooltip: undefined,
  tree: undefined,
  treegrid: "grid",
  treeitem: undefined,
}

describe.each<OS>(["ios", "android"])("the translation on %s", (os) => {
  test.each(rows)("%j becomes its native props", (attrs, ios, android) => {
    expect(toNativeProps(attrs, os)).toEqual(os === "ios" ? ios : android)
  })

  test.each(dropped)("%s is dropped", (name) => {
    expect(toNativeProps({ [name]: "x" }, os)).toEqual({})
  })

  test.each(Object.entries(roles))("role %s becomes %s", (role, native) => {
    expect(toNativeProps({ role }, os)).toEqual(
      native ? { accessibilityRole: native } : {}
    )
  })

  test("an undefined attribute is ignored", () => {
    expect(
      toNativeProps({ "aria-label": undefined, id: undefined }, os)
    ).toEqual({})
  })

  test("a mirrored icon flips right to left, and stays as it is left to right", () => {
    const icon = { "aria-hidden": "true", "data-mirror": "" }
    expect(toNativeProps(icon, os, true)).toEqual({
      ...hiddenProps[os],
      style: { transform: [{ scaleX: -1 }] },
    })
    expect(toNativeProps(icon, os)).toEqual(hiddenProps[os])
  })
})

describe("the translation's table", () => {
  const covered = new Set([
    ...rows.flatMap(([attrs]) => Object.keys(attrs)),
    ...dropped,
  ])

  test("covers every ARIA attribute core's slots emit", () => {
    expect(emitted.aria.length).toBeGreaterThan(30)
    expect(emitted.aria.filter((name) => !covered.has(name))).toEqual([])
  })

  test("covers every role core's slots declare", () => {
    expect(emitted.roles.length).toBeGreaterThan(30)
    expect(emitted.roles.filter((role) => !(role in roles))).toEqual([])
  })

  test("covers every HTML attribute core's slots may emit", () => {
    expect(emitted.html).toEqual(
      expect.arrayContaining(["id", "disabled", "type", "hidden", "tabindex"])
    )
    expect(emitted.html.filter((name) => !covered.has(name))).toEqual([])
  })
})

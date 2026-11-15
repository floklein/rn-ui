import type { Framework } from "./frameworks"
import { accordion } from "@ui-sdk/core/accordion"
import { timeline } from "@ui-sdk/core/timeline"
import { collapsible } from "@ui-sdk/core/collapsible"
import { colorPicker } from "@ui-sdk/core/color-picker"
import { imageCropper } from "@ui-sdk/core/image-cropper"
import { checkbox, checkboxGroup } from "@ui-sdk/core/checkbox"
import { switchPrimitive } from "@ui-sdk/core/switch"
import { autocomplete } from "@ui-sdk/core/autocomplete"
import { combobox } from "@ui-sdk/core/combobox"
import { command } from "@ui-sdk/core/command"
import { fileInput } from "@ui-sdk/core/file-input"
import { field, fieldSet } from "@ui-sdk/core/field"
import { input, inputGroup, textarea } from "@ui-sdk/core/input"
import { radioGroup } from "@ui-sdk/core/radio"
import { rating } from "@ui-sdk/core/rating"
import { segmentedControl } from "@ui-sdk/core/segmented-control"
import { menu } from "@ui-sdk/core/menu"
import { numberInput } from "@ui-sdk/core/number-input"
import { alertDialog, dialog } from "@ui-sdk/core/dialog"
import { drawer } from "@ui-sdk/core/drawer"
import { popover } from "@ui-sdk/core/popover"
import { select } from "@ui-sdk/core/select"
import {
  comboboxChips,
  comboboxCreate,
  comboboxItemIcons,
  comboboxSelectAll,
  menuCheckable,
  menuContextTrigger,
  menuItemIcons,
  selectItemIcons,
  selectSelectAll,
} from "@ui-sdk/core/renderer"
import {
  attrs as partAttrs,
  partState,
  press,
} from "@ui-sdk/core/internal/foundation/kernel/part"
import { selectAllKey } from "@ui-sdk/core/internal/foundation/lists/listbox-keys"
import { tooltip } from "@ui-sdk/core/tooltip"
import { hoverCard } from "@ui-sdk/core/hover-card"
import { navigationMenu } from "@ui-sdk/core/navigation-menu"
import type { PrimitiveInstance } from "@ui-sdk/core"
import { resizable } from "@ui-sdk/core/resizable"
import { slider } from "@ui-sdk/core/slider"
import { avatar } from "@ui-sdk/core/avatar"
import { progress } from "@ui-sdk/core/progress"
import { meter } from "@ui-sdk/core/meter"
import { scrollArea } from "@ui-sdk/core/scroll-area"
import { otpInput } from "@ui-sdk/core/otp-input"
import { dateInput, type DateInputSegmentData } from "@ui-sdk/core/date-input"
import { timeInput } from "@ui-sdk/core/time-input"
import { listbox } from "@ui-sdk/core/listbox"
import { pagination } from "@ui-sdk/core/pagination"
import { calendar } from "@ui-sdk/core/calendar"
import { datePicker } from "@ui-sdk/core/date-picker"
import { carousel } from "@ui-sdk/core/carousel"
import { passwordInput } from "@ui-sdk/core/password-input"
import { tabs } from "@ui-sdk/core/tabs"
import { tokenInput } from "@ui-sdk/core/token-input"
import { triggerMenu } from "@ui-sdk/core/trigger-menu"
import { button } from "@ui-sdk/core/button"
import { label } from "@ui-sdk/core/label"
import { separator } from "@ui-sdk/core/separator"
import { toggle, toggleGroup } from "@ui-sdk/core/toggle"
import { toolbar } from "@ui-sdk/core/toolbar"
import { tree } from "@ui-sdk/core/tree"
import { waterfall } from "@ui-sdk/core/waterfall"
import { menubar } from "@ui-sdk/core/menubar"
import { createOverlays } from "@ui-sdk/core/overlays"
import { createToaster, toastRegion } from "@ui-sdk/core/toast"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { repoRoot } from "./repo-root"

// Core files are named from their folder, like "motion/presence.ts" or "menu/menu.ts".
const coreSource = (file: string) => {
  const foundation = path.join(repoRoot, "packages/core/src/foundation", file)
  return existsSync(foundation)
    ? foundation
    : path.join(repoRoot, "packages/core/src/components", file)
}

type Description = { text: string; values?: string[] }

const statuses = (["complete", "current", "upcoming"] as const).map(
  (status) => ({ value: status, status })
)

// Date Input and Time Input set the same attributes.
const segmentedDescriptions = (
  kind: "date" | "time"
): Record<string, Description> => ({
  "data-disabled": {
    text: "Present when disabled, by its own prop or a `<fieldset>`.",
  },
  "data-readonly": { text: "Present when read-only." },
  "data-required": { text: "Present when required." },
  "data-invalid": {
    text:
      kind === "date"
        ? "Present while the date is before `min`, after `max` or unavailable."
        : "Present while the time is before `min` or after `max`.",
  },
  "root:data-empty": { text: "Present while every segment is empty." },
  "segment:data-empty": {
    text: "Present while the segment is empty. It shows its placeholder.",
  },
  "segment:data-type": {
    text: "The segment's unit, or `literal` for the text between segments.",
    values:
      kind === "date"
        ? [
            "year",
            "month",
            "day",
            "hour",
            "minute",
            "second",
            "dayPeriod",
            "literal",
          ]
        : ["hour", "minute", "second", "dayPeriod", "literal"],
  },
})

// An instance with the features that register its optional parts, the way
// an adapter registers one when its part renders.
function withFeatures<T extends Pick<PrimitiveInstance, "use">>(
  instance: T,
  features: Parameters<PrimitiveInstance["use"]>[0][]
) {
  for (const feature of features) {
    instance.use(feature)
  }
  return instance
}

const menuFeatures = [menuCheckable, menuContextTrigger, menuItemIcons]

// A slider with its first thumb grabbed, for data-dragging.
function dragging(instance: ReturnType<typeof slider>) {
  instance.api.internal.begin(50, 0)
  return instance
}

// A group with its first handle grabbed, for data-dragging.
function resizing(instance: ReturnType<typeof resizable>) {
  instance.api.internal.setPanels(["a", "b"], [{}, {}])
  instance.api.internal.setHandles({ h: 0 })
  instance.api.internal.startDrag(0, "h")
  return instance
}

// A dialog whose Close part's action is running, for data-pending.
function pending(instance: PrimitiveInstance) {
  press(
    instance.part("close", {
      id: "pending",
      action: () => new Promise(() => {}),
    })
  )?.()
  return instance
}

const DIALOG_DESCRIPTIONS: Record<string, Description> = {
  "data-open": {
    text: "Present while the dialog is open. On a trigger, while it's open from that trigger.",
  },
  "data-closed": {
    text: "Present while the dialog is closed, including while it animates out.",
  },
  "trigger:data-disabled": { text: "Present when the trigger is disabled." },
  "data-nested": {
    text: "Present when the dialog was opened from inside another dialog.",
  },
  "data-nested-open": {
    text: "Present while a dialog opened from inside this one is open.",
  },
  "data-pending": { text: "Present on a Close part while its action runs." },
  "data-keyboard": {
    text: "Present while the on-screen keyboard covers part of the page.",
  },
  "data-starting-style": {
    text: "Present for the first frame. Style the state you animate from.",
  },
  "data-ending-style": {
    text: "Present while the dialog animates out. Style the state you animate to.",
  },
}

// A file for the file input's samples.
const docsFile = new File([""], "photo.png")

// Styling hooks per component, read from the primitive itself so names and
// values cannot drift. `instances` covers the states worth sampling,
// `interactive` the files whose setAttribute("data-…") calls add attributes
// while people interact, and `descriptions` what each attribute means. Values
// listed there replace sampled ones, for attributes that depend on layout.
const components: Record<
  string,
  {
    instances: () => PrimitiveInstance[]
    samples: Record<string, Record<string, unknown>[]>
    interactive: { file: string; slot: string }[]
    descriptions: Record<string, Description>
    // Parts whose names don't follow <Component><Slot>, like Checkbox for the
    // checkbox root. `slot` is the data-slot, when the primitive's name differs.
    parts?: Record<string, { react: string; web: string; slot?: string }>
    // Attributes a slot writes only in states the samples can't reach, like
    // data-highlighted while an item has the highlight, per slot.
    extra?: Record<string, string[]>
  }
> = {
  meter: {
    instances: () => [meter({ id: "docs", value: 40 })],
    samples: {
      root: [{}],
      track: [{}],
      indicator: [{}],
      label: [{}],
      value: [{}],
    },
    interactive: [],
    descriptions: {},
    parts: { root: { react: "Meter", web: "<ui-meter>" } },
  },
  menu: {
    instances: () =>
      [false, true].flatMap((open) => {
        const root = withFeatures(
          menu({ id: "docs", defaultOpen: open }),
          menuFeatures
        )
        // A submenu, for attributes only nested menus have.
        return [
          root,
          withFeatures(
            menu({ id: "docs-sub", defaultOpen: open, parent: root.api }),
            menuFeatures
          ),
        ]
      }),
    samples: {
      trigger: [{}],
      "context-trigger": [{ id: "c" }, { id: "d", disabled: true }],
      content: [{}],
      item: [{ id: "a" }, { id: "b", disabled: true }],
      "checkbox-item": [
        { value: "a", defaultChecked: true },
        { value: "b", defaultChecked: false },
      ],
      "item-indicator": [
        { id: "i", item: "checkbox-item", itemKey: "a", keepMounted: true },
        { id: "j", item: "checkbox-item", itemKey: "b", keepMounted: true },
      ],
      "radio-group": [{ id: "g", name: "g", defaultValue: "a" }],
      "radio-item": [
        { group: "g", value: "a" },
        { group: "g", value: "b" },
      ],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
      shortcut: [{}],
      "item-icon": [{ id: "i", mirror: true }],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
      { file: "menu/menu.ts", slot: "item" },
    ],
    extra: { item: ["data-has-icon"], content: ["data-has-icons"] },
    descriptions: {
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on an item while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any item inside holds an icon part, so items without one can line up.",
      },
      "data-open": {
        text: "Present while the menu is open. A submenu trigger has it while its submenu is open.",
      },
      "data-closed": {
        text: "Present while the menu is closed, including while it animates out.",
      },
      "trigger:data-open": {
        text: "Present on the trigger that opened the menu, while it's open.",
      },
      "trigger:data-closed": {
        text: "Present on a trigger while the menu isn't open from it.",
      },
      "context-trigger:data-open": {
        text: "Present on the area that opened the menu, while it's open.",
      },
      "context-trigger:data-closed": {
        text: "Present on an area while the menu isn't open from it.",
      },
      "data-checked": {
        text: "Present on checked checkbox items, and on the radio item that's its group's value.",
      },
      "data-unchecked": { text: "Present on items that aren't checked." },
      "item-indicator:data-checked": {
        text: "Present while its item is checked.",
      },
      "item-indicator:data-unchecked": {
        text: "Present while its item isn't checked, with `keepMounted`.",
      },
      "data-disabled": { text: "Present when the item can't be chosen." },
      "trigger:data-disabled": {
        text: "Present when the trigger is disabled.",
      },
      "data-highlighted": {
        text: "Present on the item with keyboard focus or under the pointer.",
      },
      "data-presentation": {
        text: "How the menu presents this time it's open. Submenus present like their root.",
        values: ["popover", "sheet"],
      },
      "data-nested": { text: "Present on submenus." },
      "data-side": {
        text: "Where the menu ended up, after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the menu lines up with its trigger.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the menu animates out. Style the state you animate to.",
      },
    },
  },
  select: {
    instances: () =>
      [
        ...[false, true].map((open) =>
          select({ id: "docs", defaultOpen: open, defaultValue: "a" })
        ),
        select({
          id: "docs-form",
          disabled: true,
          readOnly: true,
          required: true,
        }),
        select({
          id: "docs-multiple",
          multiple: true,
          defaultValue: ["a"],
          status: "loading",
        }),
      ].map((instance) =>
        withFeatures(instance, [selectItemIcons, selectSelectAll])
      ),
    samples: {
      label: [{}],
      trigger: [{}, { disabled: true }],
      value: [{}],
      clear: [{}],
      content: [{}],
      list: [{}],
      input: [{}],
      item: [
        { id: "a", value: "a" },
        { id: "b", value: "b", disabled: true },
      ],
      "item-text": [{ id: "a", text: "Apple" }],
      "item-indicator": [{ id: "i", item: "a", keepMounted: true }],
      "select-all": [{ id: selectAllKey() }],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
      empty: [{}],
      status: [{}],
      arrow: [{}],
      "item-icon": [{ id: "i", mirror: true }],
      "value-icon": [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
      { file: "kernel/modality.ts", slot: "content" },
    ],
    extra: {
      item: ["data-highlighted", "data-has-icon"],
      "item-text": ["data-matched"],
      "select-all": ["data-highlighted"],
      empty: ["data-empty"],
      content: ["data-has-icons"],
    },
    descriptions: {
      "data-presentation": {
        text: "How the list presents this time it's open.",
        values: ["popover", "sheet"],
      },
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on an item while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any item inside holds an icon part, so items without one can line up.",
      },
      "data-open": { text: "Present while the list is open." },
      "data-closed": {
        text: "Present while the list is closed, including while it animates out.",
      },
      "data-disabled": {
        text: "Present when the select is disabled, by its own prop, a field or a `<fieldset>`.",
      },
      "trigger:data-disabled": {
        text: "Present when the select or the trigger is disabled.",
      },
      "item:data-disabled": { text: "Present when the item can't be chosen." },
      "clear:data-disabled": {
        text: "Present when the select is disabled or read-only.",
      },
      "data-readonly": { text: "Present when the select is read-only." },
      "data-required": { text: "Present when the select is required." },
      "data-placeholder": {
        text: "Present while nothing is selected, so the placeholder shows.",
      },
      "data-selected": {
        text: "Present on selected items, and on the check inside them.",
      },
      "data-highlighted": {
        text: "Present on the item with keyboard focus or under the pointer, or highlighted while focus stays in the search field.",
      },
      "data-matched": {
        text: "Present on an item's text while the search matched part of it, which is marked.",
      },
      "data-checked": {
        text: "Present on a select-all option while every item it covers is selected.",
      },
      "data-unchecked": {
        text: "Present on a select-all option while none of its items is selected.",
      },
      "data-indeterminate": {
        text: "Present on a select-all option while some of its items are selected.",
      },
      "select-all:data-disabled": {
        text: "Present when nothing the select-all option covers can be chosen.",
      },
      "data-empty": { text: "Present while no item matches the search." },
      "data-loading": {
        text: 'Present while results load, with `status="loading"`.',
      },
      "data-side": {
        text: "Where the list ended up, after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the list lines up with the trigger.",
        values: ["start", "center", "end"],
      },
      "data-modality": {
        text: "Whether the keyboard or a pointer is in use, for focus styles.",
        values: ["keyboard", "pointer"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the list animates out. Style the state you animate to.",
      },
    },
  },
  combobox: {
    instances: () =>
      [
        ...[false, true].map((open) =>
          combobox({ id: "docs", defaultOpen: open, defaultValue: "a" })
        ),
        combobox({
          id: "docs-form",
          disabled: true,
          readOnly: true,
          required: true,
          status: "loading",
        }),
        combobox({ id: "docs-multiple", multiple: true, defaultValue: ["a"] }),
      ].map((instance) =>
        withFeatures(instance, [
          comboboxChips,
          comboboxCreate,
          comboboxItemIcons,
          comboboxSelectAll,
        ])
      ),
    samples: {
      label: [{}],
      input: [{}],
      trigger: [{}],
      clear: [{}],
      chips: [{}],
      "chips-overflow": [{}],
      chip: [{ id: "a", value: "a" }],
      "chip-remove": [{ id: "a", value: "a" }],
      content: [{}],
      list: [{}],
      item: [
        { id: "a", value: "a" },
        { id: "b", value: "b", disabled: true },
      ],
      "item-indicator": [{ id: "i", item: "a", keepMounted: true }],
      "item-text": [{ id: "a", text: "Argentina" }],
      "select-all": [{ id: selectAllKey() }],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
      create: [{}],
      empty: [{}],
      status: [{}],
      arrow: [{}],
      "item-icon": [{ id: "i", mirror: true }],
      "value-icon": [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
      { file: "kernel/modality.ts", slot: "content" },
    ],
    extra: {
      item: ["data-highlighted", "data-has-icon"],
      "item-text": ["data-matched"],
      "select-all": ["data-highlighted"],
      create: ["data-highlighted", "data-pending"],
      empty: ["data-empty"],
      content: ["data-has-icons"],
    },
    descriptions: {
      "data-presentation": {
        text: "How the list presents this time it's open.",
        values: ["popover", "sheet"],
      },
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on an item while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any item inside holds an icon part, so items without one can line up.",
      },
      "data-open": { text: "Present while the list is open." },
      "data-closed": {
        text: "Present while the list is closed, including while it animates out.",
      },
      "data-disabled": {
        text: "Present when the combobox is disabled, by its own prop, a field or a `<fieldset>`.",
      },
      "item:data-disabled": {
        text: "Present when the item can't be chosen, or `maxSelected` is reached.",
      },
      "clear:data-disabled": {
        text: "Present when the combobox is disabled or read-only.",
      },
      "chip:data-disabled": {
        text: "Present when the combobox is disabled or read-only, so the chip can't be removed.",
      },
      "chip-remove:data-disabled": {
        text: "Present when the combobox is disabled or read-only.",
      },
      "data-readonly": { text: "Present when the combobox is read-only." },
      "data-required": { text: "Present when the combobox is required." },
      "data-value": { text: "The chip's value, as the string it submits as." },
      "data-selected": {
        text: "Present on selected items, and on the check inside them.",
      },
      "data-highlighted": {
        text: "Present on the highlighted item. Focus stays in the input.",
      },
      "create:data-highlighted": {
        text: "Present while the create option is highlighted.",
      },
      "data-pending": {
        text: "Present while the Promise `onCreate` returned is running.",
      },
      "data-empty": { text: "Present while no item matches." },
      "data-loading": {
        text: 'Present while results load, with `status="loading"`.',
      },
      "data-matched": {
        text: "Present on an item's text while the input's text matched part of it, which is marked.",
      },
      "data-checked": {
        text: "Present on a select-all option while every item it covers is selected.",
      },
      "data-unchecked": {
        text: "Present on a select-all option while none of its items is selected.",
      },
      "data-indeterminate": {
        text: "Present on a select-all option while some of its items are selected.",
      },
      "select-all:data-disabled": {
        text: "Present when nothing the select-all option covers can be chosen, or choosing them all would pass `maxSelected`.",
      },
      "data-side": {
        text: "Where the list ended up, after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the list lines up with the input.",
        values: ["start", "center", "end"],
      },
      "data-modality": {
        text: "Whether the keyboard or a pointer moves the highlight. Style a focus ring for the keyboard only.",
        values: ["keyboard", "pointer"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the list animates out. Style the state you animate to.",
      },
    },
  },
  command: {
    instances: () => [
      command({ id: "docs" }),
      command({ id: "docs-loading", status: "loading" }),
    ],
    samples: {
      root: [{}],
      input: [{}],
      list: [{}],
      item: [
        { id: "a", value: "a", shortcut: "mod+a" },
        { id: "b", value: "b", disabled: true },
      ],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
      empty: [{}],
      status: [{}],
      shortcut: [{ shortcut: "mod+a" }],
      "item-text": [{ id: "a", text: "Calendar" }],
      "item-icon": [{ id: "i", mirror: true }],
    },
    parts: { root: { react: "Command", web: "<ui-command>" } },
    interactive: [],
    extra: {
      item: ["data-highlighted", "data-pending", "data-has-icon"],
      "item-text": ["data-matched"],
      empty: ["data-empty"],
      list: ["data-has-icons"],
    },
    descriptions: {
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on a command while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any command inside holds an icon part, so items without one can line up.",
      },
      "data-loading": {
        text: 'Present while results load, with `status="loading"`.',
      },
      "data-disabled": {
        text: "Present when the command can't run. Arrow keys skip it.",
      },
      "data-highlighted": {
        text: "Present on the highlighted command, which Enter runs. Focus stays in the field.",
      },
      "data-pending": {
        text: "Present while the Promise the command's `onSelect` or `onAction` returned is running.",
      },
      "data-empty": { text: "Present while no command matches." },
      "data-matched": {
        text: "Present on a command's text while the search matched part of it, which is marked.",
      },
    },
  },
  autocomplete: {
    instances: () => [
      ...[false, true].map((open) =>
        autocomplete({ id: "docs", defaultOpen: open, defaultValue: "a" })
      ),
      autocomplete({
        id: "docs-form",
        disabled: true,
        readOnly: true,
        required: true,
        status: "loading",
      }),
    ],
    samples: {
      label: [{}],
      input: [{}],
      trigger: [{}],
      clear: [{}],
      content: [{}],
      list: [{}],
      item: [
        { id: "a", value: "a" },
        { id: "b", value: "b", disabled: true },
      ],
      "item-text": [{ id: "a", text: "Apple" }],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
      empty: [{}],
      status: [{}],
      arrow: [{}],
      "item-icon": [{ id: "i", mirror: true }],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
      { file: "kernel/modality.ts", slot: "content" },
    ],
    extra: {
      item: ["data-highlighted", "data-has-icon"],
      "item-text": ["data-matched"],
      empty: ["data-empty"],
      content: ["data-has-icons"],
    },
    descriptions: {
      "data-presentation": {
        text: "How the suggestions present this time they're open.",
        values: ["popover", "sheet"],
      },
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on a suggestion while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any suggestion inside holds an icon part, so items without one can line up.",
      },
      "data-open": { text: "Present while the suggestions are open." },
      "data-closed": {
        text: "Present while the suggestions are closed, including while they animate out.",
      },
      "data-disabled": {
        text: "Present when the field is disabled, by its own prop, a field or a `<fieldset>`.",
      },
      "item:data-disabled": {
        text: "Present when the suggestion can't be chosen. Arrow keys skip it.",
      },
      "clear:data-disabled": {
        text: "Present when the field is disabled or read-only.",
      },
      "data-readonly": { text: "Present when the field is read-only." },
      "data-required": { text: "Present when the field is required." },
      "data-highlighted": {
        text: "Present on the highlighted suggestion, which Enter fills in. Focus stays in the field.",
      },
      "data-empty": { text: "Present while no suggestion matches." },
      "data-matched": {
        text: "Present on a suggestion's text while the field's text matched part of it, which is marked.",
      },
      "data-loading": {
        text: 'Present while results load, with `status="loading"`.',
      },
      "data-side": {
        text: "Where the suggestions ended up, after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the suggestions line up with the field.",
        values: ["start", "center", "end"],
      },
      "data-modality": {
        text: "Whether the keyboard or a pointer moves the highlight. Style a focus ring for the keyboard only.",
        values: ["keyboard", "pointer"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the list animates out. Style the state you animate to.",
      },
    },
  },
  tabs: {
    instances: () => [
      tabs({ id: "docs", defaultValue: "a" }),
      tabs({ id: "docs-vertical", defaultValue: "a", orientation: "vertical" }),
    ],
    samples: {
      root: [{}],
      list: [{}],
      tab: [{ value: "a" }, { value: "b", disabled: true }],
      "tab-icon": [{ id: "i", mirror: true }],
      indicator: [{}],
      panel: [{ value: "a" }],
    },
    parts: { root: { react: "Tabs", web: "<ui-tabs>" } },
    interactive: [{ file: "motion/presence.ts", slot: "panel" }],
    extra: { tab: ["data-has-icon"], list: ["data-has-icons"] },
    descriptions: {
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on a tab while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any tab inside holds an icon part, so items without one can line up.",
      },
      "data-orientation": { text: "Which arrow keys move between tabs." },
      "data-activation-direction": {
        text: "Which way the last selection moved on screen. Use it to slide panels in from the right side.",
        values: ["none", "left", "right", "up", "down"],
      },
      "data-selected": { text: "Present on the selected tab and its panel." },
      "data-disabled": { text: "Present when the tab can't be selected." },
      "data-starting-style": {
        text: "Present for a panel's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the previous panel animates out. Style the state you animate to.",
      },
    },
  },
  accordion: {
    instances: () => [
      accordion({ id: "docs", defaultValue: ["a"] }),
      accordion({ id: "docs-disabled", disabled: true }),
    ],
    samples: {
      root: [{}],
      item: [{ value: "a" }, { value: "b", disabled: true }],
      header: [{ value: "a" }, { value: "b" }],
      trigger: [{ value: "a" }, { value: "b", disabled: true }],
      panel: [{ value: "a" }, { value: "b" }],
    },
    parts: { root: { react: "Accordion", web: "<ui-accordion>" } },
    interactive: [{ file: "motion/presence.ts", slot: "panel" }],
    descriptions: {
      "data-open": { text: "Present while the item is open." },
      "data-closed": {
        text: "Present while the item is closed, including while its panel animates out.",
      },
      "data-index": {
        text: "The item's position among the items, from 0. Written once it's in the page.",
      },
      "data-disabled": { text: "Present when the item can't open or close." },
      "root:data-disabled": {
        text: "Present when the whole accordion is disabled.",
      },
      "data-starting-style": {
        text: "Present for a panel's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while a panel animates closed. Style the state you animate to.",
      },
    },
  },
  timeline: {
    instances: () => [
      timeline({ id: "docs" }),
      timeline({ id: "docs-feed", feed: true, busy: true }),
    ],
    samples: {
      root: [{}],
      item: statuses,
      marker: statuses,
      connector: statuses,
      time: statuses,
      title: statuses,
      description: statuses,
    },
    interactive: [],
    extra: { item: ["data-first", "data-last"] },
    descriptions: {
      "data-orientation": {
        text: "Which way the events run.",
        values: ["horizontal", "vertical"],
      },
      "data-busy": {
        text: "Present while a feed is loading or changing events, with `busy`.",
      },
      "data-complete": {
        text: "Present when the event's status is `complete`.",
      },
      "data-current": {
        text: "Present when the event's status is `current`.",
      },
      "data-upcoming": {
        text: "Present when the event's status is `upcoming`.",
      },
      "data-first": {
        text: "Present on the first event. Written once it's in the page.",
      },
      "data-last": {
        text: "Present on the last event. Written once it's in the page.",
      },
    },
    parts: { root: { react: "Timeline", web: "<ui-timeline>" } },
  },
  collapsible: {
    instances: () => [
      collapsible({ id: "docs", defaultOpen: true }),
      collapsible({ id: "docs-closed", disabled: true }),
    ],
    samples: { root: [{}], trigger: [{}], panel: [{ keepMounted: true }] },
    interactive: [{ file: "motion/presence.ts", slot: "panel" }],
    parts: { root: { react: "Collapsible", web: "<ui-collapsible>" } },
    descriptions: {
      "data-open": { text: "Present while the panel is open." },
      "data-closed": {
        text: "Present while the panel is closed, including while it animates out.",
      },
      "data-disabled": {
        text: "Present when the collapsible can't open or close.",
      },
      "data-starting-style": {
        text: "Present for the panel's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the panel animates closed. Style the state you animate to.",
      },
    },
  },
  "image-cropper": {
    instances: () => [
      imageCropper({
        id: "docs",
        src: "photo.jpg",
        mode: "frame",
        shape: "circle",
        disabled: true,
      }),
      imageCropper({ id: "docs-box", src: "photo.jpg" }),
    ],
    samples: {
      root: [{}],
      viewport: [{}],
      image: [{}],
      selection: [{}],
      grid: [{}],
      handle: [{ position: "nw" }, { position: "e" }],
      zoom: [{}],
      rotate: [{}],
      flip: [{}, { direction: "vertical" }],
    },
    interactive: [],
    extra: {
      ...Object.fromEntries(
        ["root", "viewport", "selection", "grid", "handle"].map((slot) => [
          slot,
          ["data-error", "data-dragging"],
        ])
      ),
      ...Object.fromEntries(
        ["image", "zoom", "rotate", "flip"].map((slot) => [
          slot,
          ["data-error"],
        ])
      ),
    },
    descriptions: {
      "data-mode": { text: "How the crop changes.", values: ["box", "frame"] },
      "data-shape": {
        text: "The selection's shape.",
        values: ["rectangle", "circle"],
      },
      "data-loading": {
        text: "Present until the image loads, while nothing can change.",
      },
      "data-error": { text: "Present when the image failed to load." },
      "data-disabled": { text: "Present when the cropper is disabled." },
      "data-dragging": {
        text: "Present while a pointer drags the selection, the image or, on a handle, that handle. Show the grid with it.",
      },
      "data-position": {
        text: "The edge or corner the handle resizes.",
        values: ["n", "e", "s", "w", "ne", "nw", "se", "sw"],
      },
      "data-direction": {
        text: "Which way the button mirrors the image.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: { root: { react: "ImageCropper", web: "<ui-image-cropper>" } },
  },
  "color-picker": {
    instances: () => [
      colorPicker({
        id: "docs",
        defaultValue: "#0ea5e9",
        disabled: true,
        readOnly: true,
        required: true,
      }),
      colorPicker({ id: "docs-enabled", defaultValue: "#0ea5e9" }),
    ],
    samples: {
      root: [{}],
      area: [{}],
      "area-thumb": [{}],
      slider: [
        { channel: "hue" },
        { channel: "alpha", orientation: "vertical" },
      ],
      "slider-thumb": [
        { channel: "hue" },
        { channel: "alpha", orientation: "vertical" },
      ],
      input: [{}],
      "channel-input": [{ channel: "red" }],
      swatch: [{}],
      "eye-dropper": [{}],
      swatches: [{}],
      "swatch-item": [{ value: "#0ea5e9" }, { value: "#ef4444" }],
    },
    interactive: [],
    extra: {
      ...Object.fromEntries(
        [
          "root",
          "area",
          "area-thumb",
          "slider",
          "slider-thumb",
          "input",
          "channel-input",
          "swatch",
          "swatches",
        ].map((slot) => [slot, ["data-out-of-gamut"]])
      ),
      "eye-dropper": ["data-out-of-gamut", "data-unsupported"],
    },
    descriptions: {
      "data-disabled": {
        text: "Present when the picker is disabled, by its own prop or a `<fieldset>`.",
      },
      "data-readonly": {
        text: "Present when the picker shows its color but can't change it.",
      },
      "data-required": { text: "Present when the picker is required." },
      "data-out-of-gamut": {
        text: "Present while a drag or a key holds a color outside the gamut. The value is the closest color inside, and the parts move there once the change commits.",
      },
      "data-channel": {
        text: "The channel the part edits.",
        values: [
          "hue",
          "saturation",
          "brightness",
          "lightness",
          "chroma",
          "red",
          "green",
          "blue",
          "alpha",
        ],
      },
      "data-area-thumb": {
        text: "Present on the area's thumb, which a press on the area moves and focuses.",
      },
      "data-orientation": {
        text: "The slider's axis.",
        values: ["horizontal", "vertical"],
      },
      "data-selected": {
        text: "Present on the swatch item whose color is the value.",
      },
      "data-unsupported": {
        text: "Present when the browser can't pick a color from the screen.",
      },
    },
    parts: { root: { react: "ColorPicker", web: "<ui-color-picker>" } },
  },
  checkbox: {
    instances: () =>
      ([true, false, "indeterminate"] as const).map((checked) =>
        checkbox({
          id: "docs",
          defaultChecked: checked,
          disabled: true,
          readOnly: true,
          required: true,
        })
      ),
    samples: { root: [{}], indicator: [{ keepMounted: true }] },
    interactive: [{ file: "motion/presence.ts", slot: "indicator" }],
    descriptions: {
      "data-checked": { text: "Present while checked." },
      "data-unchecked": { text: "Present while unchecked." },
      "data-disabled": {
        text: "Present when disabled, by its own prop, a group or a `<fieldset>`.",
      },
      "data-readonly": { text: "Present when read-only." },
      "data-required": { text: "Present when required." },
      "data-indeterminate": { text: "Present while indeterminate." },
      "data-starting-style": {
        text: "Present for the indicator's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the indicator animates out. Style the state you animate to.",
      },
    },
    parts: { root: { react: "Checkbox", web: "<ui-checkbox>" } },
  },
  "checkbox-group": {
    instances: () => [
      checkboxGroup({ id: "docs", disabled: true, required: true }),
    ],
    samples: { group: [{}] },
    interactive: [],
    descriptions: {
      "data-disabled": {
        text: "Present when the group is disabled, by its own prop or a `<fieldset>`.",
      },
      "data-required": {
        text: "Present when at least one checkbox must be checked.",
      },
    },
    parts: {
      group: {
        react: "CheckboxGroup",
        web: "<ui-checkbox-group>",
        slot: "checkbox-group",
      },
    },
  },
  switch: {
    instances: () =>
      [true, false].map((checked) =>
        switchPrimitive({
          id: "docs",
          defaultChecked: checked,
          disabled: true,
          readOnly: true,
          required: true,
        })
      ),
    samples: { root: [{}], thumb: [{}] },
    interactive: [],
    descriptions: {
      "data-checked": { text: "Present while on." },
      "data-unchecked": { text: "Present while off." },
      "data-disabled": {
        text: "Present when disabled, by its own prop or a `<fieldset>`.",
      },
      "data-readonly": { text: "Present when read-only." },
      "data-required": { text: "Present when required." },
      "data-invalid": {
        text: "Present while a `Field` around it shows as invalid. The thumb doesn't get it.",
      },
    },
    parts: { root: { react: "Switch", web: "<ui-switch>" } },
    // A Field writes it on the switch.
    extra: { root: ["data-invalid"] },
  },
  button: {
    instances: () => {
      const running = button({
        id: "docs",
        action: () => new Promise(() => {}),
      })
      running.api.internal.press()
      return [running, button({ id: "docs-disabled", disabled: true })]
    },
    samples: { root: [{}] },
    interactive: [],
    descriptions: {
      "data-disabled": { text: "Present when disabled." },
      "data-pending": {
        text: "Present while the Promise its press handler returned is running.",
      },
    },
    parts: { root: { react: "Button", web: "<ui-button>" } },
  },
  toggle: {
    instances: () => {
      const group = toggleGroup({ id: "docs-group", orientation: "vertical" })
      return [
        toggle({ id: "docs", defaultPressed: true, disabled: true }),
        toggle({ id: "docs-off" }),
        toggle({ id: "docs-grouped", group: () => group.api }),
      ]
    },
    samples: { root: [{}], icon: [{ id: "i", mirror: true }] },
    interactive: [],
    extra: { root: ["data-has-icon"] },
    descriptions: {
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": { text: "Present while the toggle holds an icon part." },
      "data-pressed": { text: "Present while pressed." },
      "data-disabled": {
        text: "Present when disabled, by its own prop or its group.",
      },
      "data-orientation": {
        text: "Inside a group, the group's orientation.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: { root: { react: "Toggle", web: "<ui-toggle>" } },
  },
  "toggle-group": {
    instances: () => [toggleGroup({ id: "docs", disabled: true })],
    samples: { group: [{}] },
    interactive: [],
    extra: { group: ["data-has-icons"] },
    descriptions: {
      "data-has-icons": {
        text: "Present while any toggle inside holds an icon part, so toggles without one can line up.",
      },
      "data-disabled": { text: "Present when the whole group is disabled." },
      "data-orientation": {
        text: "Which arrow keys move between toggles.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: {
      group: {
        react: "ToggleGroup",
        web: "<ui-toggle-group>",
        slot: "toggle-group",
      },
    },
  },
  toolbar: {
    instances: () => [
      toolbar({ id: "docs", disabled: true }),
      toolbar({ id: "docs-vertical", orientation: "vertical" }),
    ],
    samples: {
      root: [{}],
      button: [{ id: "b" }],
      link: [{ id: "l" }],
      input: [{ id: "i" }],
      group: [{ id: "g", disabled: true }],
      separator: [{}],
    },
    interactive: [],
    descriptions: {
      "data-disabled": {
        text: "Present when disabled, by the item itself, its group or the toolbar.",
      },
      "data-orientation": {
        text: "The toolbar's orientation. On a separator, which way the line runs: across the toolbar.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: {
      root: { react: "Toolbar", web: "<ui-toolbar>" },
      button: { react: "ToolbarButton", web: "<ui-toolbar-button>" },
      link: { react: "ToolbarLink", web: "<ui-toolbar-link>" },
      input: { react: "ToolbarInput", web: "<ui-toolbar-input>" },
      group: { react: "ToolbarGroup", web: "<ui-toolbar-group>" },
      separator: { react: "ToolbarSeparator", web: "<ui-toolbar-separator>" },
    },
  },
  tree: {
    instances: () => {
      const items = [
        {
          value: "src",
          label: "src",
          children: [
            { value: "a.ts", label: "a.ts" },
            { value: "b.ts", label: "b.ts", disabled: true },
          ],
        },
        { value: "c.ts", label: "c.ts" },
      ]
      return [
        tree({
          id: "docs",
          items,
          mode: "multiple",
          defaultValue: ["a.ts"],
          defaultExpanded: ["src"],
          checkable: true,
          defaultChecked: ["a.ts"],
          current: "a.ts",
        }),
        tree({
          id: "docs-collapsed",
          items,
          checkable: true,
          defaultChecked: ["src"],
        }),
      ]
    },
    samples: {
      root: [{}],
      item: [
        { value: "src" },
        { value: "a.ts" },
        { value: "b.ts" },
        { value: "c.ts" },
      ],
      label: [{ value: "src" }, { value: "a.ts" }, { value: "b.ts" }],
      indicator: [{ value: "src" }],
      checkbox: [{ value: "src" }, { value: "a.ts" }, { value: "c.ts" }],
      group: [{ value: "src" }],
    },
    interactive: [{ file: "motion/panel.ts", slot: "group" }],
    extra: {
      item: ["data-loading", "data-failed", "data-pending"],
      label: ["data-loading", "data-failed", "data-pending"],
      indicator: ["data-loading", "data-failed", "data-pending"],
    },
    descriptions: {
      "data-level": {
        text: "The item's depth, from 1 at the top level. Also in the `--tree-level` variable.",
      },
      "data-branch": {
        text: "Present on a branch: an item with children, or with `branch` set.",
      },
      "data-expanded": { text: "Present while a branch is expanded." },
      "data-selected": { text: "Present while the item is selected." },
      "data-disabled": {
        text: "Present when the item, or the whole tree, is disabled.",
      },
      "data-current": {
        text: "Present on the item for the current page, from `current`.",
      },
      "data-loading": {
        text: "Present while `loadChildren` loads the branch's children.",
      },
      "data-failed": {
        text: "Present after the branch's children failed to load, until it loads again.",
      },
      "data-pending": {
        text: "Present while the item's `onAction` Promise hasn't settled.",
      },
      "data-checked": {
        text: "Present while the item's checkbox is checked, with `checkable`.",
      },
      "data-unchecked": {
        text: "Present while the item's checkbox is unchecked, with `checkable`.",
      },
      "data-indeterminate": {
        text: "Present while only some of a branch is checked, with `checkable`.",
      },
      "group:data-open": {
        text: "Present while the group's branch is expanded.",
      },
      "group:data-closed": {
        text: "Present while the group's branch is collapsed, including while it animates out.",
      },
      "data-starting-style": {
        text: "Present for a group's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while a group animates closed. Style the state you animate to.",
      },
    },
    parts: {
      root: { react: "Tree", web: "<ui-tree>" },
      label: { react: "TreeItemLabel", web: "<ui-tree-item-label>" },
      indicator: {
        react: "TreeItemIndicator",
        web: "<ui-tree-item-indicator>",
      },
      checkbox: { react: "TreeItemCheckbox", web: "<ui-tree-item-checkbox>" },
    },
  },
  waterfall: {
    instances: () => {
      const items = [
        {
          value: "page",
          label: "GET /",
          start: 0,
          duration: 1000,
          children: [
            { value: "api", label: "GET /api", start: 200, duration: 300 },
          ],
        },
        { value: "font", label: "GET /font", start: 1200, duration: 400 },
      ]
      return [
        waterfall({
          id: "docs",
          items,
          defaultValue: "api",
          defaultExpanded: ["page"],
        }),
        waterfall({ id: "docs-zoomed", items, range: [0, 1000] }),
      ]
    },
    samples: {
      root: [{}],
      "header-row": [{}],
      "column-header": [{}],
      axis: [{}],
      tick: [{ time: 500 }],
      mark: [{ time: 400 }, { time: 1500 }],
      row: [{ value: "page" }, { value: "api" }, { value: "font" }],
      "row-header": [{ value: "page" }, { value: "api" }],
      indicator: [{ value: "page" }],
      cell: [{ value: "page" }, { value: "api" }],
      bar: [{ value: "page" }, { value: "api" }],
    },
    interactive: [],
    descriptions: {
      "data-level": {
        text: "The span's depth, from 1 at the top level. Also in the `--waterfall-level` variable.",
      },
      "data-branch": { text: "Present on a span with children." },
      "data-expanded": {
        text: "Present while a span with children is expanded.",
      },
      "data-selected": {
        text: "Present on the selected span's row and its parts.",
      },
      "data-outside": {
        text: "Present while the mark's time is outside the range, so it doesn't show on the axis.",
      },
    },
    parts: {
      root: { react: "Waterfall", web: "<ui-waterfall>" },
    },
  },
  menubar: {
    instances: () => {
      const open = menubar({ id: "docs", disabled: true })
      open.api.internal.openChanged("file", true)
      return [open, menubar({ id: "docs-vertical", orientation: "vertical" })]
    },
    samples: { root: [{}] },
    interactive: [],
    descriptions: {
      "data-open": { text: "Present while one of its menus is open." },
      "data-disabled": { text: "Present when the whole menubar is disabled." },
      "data-orientation": {
        text: "Which arrow keys move between menus.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: { root: { react: "Menubar", web: "<ui-menubar>" } },
  },
  label: {
    instances: () => [label({ id: "docs" })],
    samples: { root: [{}] },
    interactive: [],
    descriptions: {},
    parts: { root: { react: "Label", web: "<ui-label>" } },
  },
  separator: {
    instances: () => [separator({ id: "docs" })],
    samples: { root: [{}] },
    interactive: [],
    descriptions: {
      "data-orientation": {
        text: "Which way the line runs.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: { root: { react: "Separator", web: "<ui-separator>" } },
  },
  radio: {
    instances: () => [
      radioGroup({
        id: "docs",
        defaultValue: "a",
        readOnly: true,
        required: true,
      }),
      radioGroup({ id: "docs-disabled", disabled: true }),
    ],
    samples: {
      group: [{}],
      root: [{ value: "a" }, { value: "b" }],
      indicator: [{ value: "a", keepMounted: true }],
    },
    interactive: [{ file: "motion/presence.ts", slot: "indicator" }],
    descriptions: {
      "data-checked": { text: "Present on the checked radio." },
      "data-unchecked": { text: "Present on radios that aren't checked." },
      "data-disabled": {
        text: "Present when disabled, by its own prop, the group or a `<fieldset>`.",
      },
      "data-readonly": { text: "Present when the group is read-only." },
      "data-required": { text: "Present when the group is required." },
      "data-starting-style": {
        text: "Present for the indicator's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the indicator animates out. Style the state you animate to.",
      },
    },
    parts: {
      group: {
        react: "RadioGroup",
        web: "<ui-radio-group>",
        slot: "radio-group",
      },
      root: { react: "Radio", web: "<ui-radio>", slot: "radio" },
      indicator: {
        react: "RadioIndicator",
        web: "<ui-radio-indicator>",
        slot: "radio-indicator",
      },
    },
  },
  rating: {
    instances: () => [
      rating({ id: "docs", defaultValue: 2.5, step: 0.5, required: true }),
      rating({
        id: "docs-read-only",
        value: 3,
        readOnly: true,
        disabled: true,
      }),
    ],
    samples: { root: [{}], item: [{ index: 1 }, { index: 3 }, { index: 4 }] },
    interactive: [],
    extra: { item: ["data-highlighted"] },
    descriptions: {
      "data-filled": { text: "Present on stars the shown score covers whole." },
      "data-partial": {
        text: "Present on the star the shown score covers part of, like the last of 2.5.",
      },
      "data-checked": { text: "Present on the star the score ends in." },
      "data-highlighted": {
        text: "Present on the stars up to the score a pointer previews.",
      },
      "data-disabled": {
        text: "Present when the rating is disabled, by its own prop or a `<fieldset>`.",
      },
      "data-readonly": {
        text: "Present when the rating only shows its score.",
      },
      "data-required": { text: "Present when the rating is required." },
    },
  },
  "segmented-control": {
    instances: () => [
      segmentedControl({
        id: "docs",
        defaultValue: "a",
        readOnly: true,
        required: true,
      }),
      segmentedControl({
        id: "docs-disabled",
        disabled: true,
        orientation: "vertical",
      }),
    ],
    samples: {
      root: [{}],
      item: [{ value: "a" }, { value: "b" }],
      indicator: [{}],
    },
    interactive: [],
    descriptions: {
      "data-orientation": { text: "Which way the items run." },
      "data-checked": { text: "Present on the checked item." },
      "data-unchecked": { text: "Present on items that aren't checked." },
      "data-disabled": {
        text: "Present when disabled, by its own prop, the control or a `<fieldset>`.",
      },
      "data-readonly": { text: "Present when the control is read-only." },
      "data-required": { text: "Present when the control is required." },
    },
    parts: {
      root: { react: "SegmentedControl", web: "<ui-segmented-control>" },
      item: {
        react: "SegmentedControlItem",
        web: "<ui-segmented-control-item>",
      },
      indicator: {
        react: "SegmentedControlIndicator",
        web: "<ui-segmented-control-indicator>",
      },
    },
  },
  field: {
    instances: () => [
      field({ id: "docs", invalid: true, disabled: true }),
      field({ id: "docs-valid" }),
    ],
    samples: {
      root: [{}],
      label: [{}],
      description: [{}],
      error: [{ match: true }],
      control: [{}],
    },
    interactive: [],
    descriptions: {
      "data-invalid": {
        text: "Present while the field shows as invalid: with `invalid`, or once a submit finds the control invalid.",
      },
      "data-valid": {
        text: "Present once a submit has shown the browser's validation and the value passes. Never while you pass `invalid`.",
      },
      "data-disabled": { text: "Present when the field is disabled." },
      "data-focused": { text: "Present while focus is in the control." },
      "data-required": { text: "Present when the control is required." },
    },
    parts: { root: { react: "Field", web: "<ui-field>" } },
  },
  slider: {
    instances: () => [
      slider({ id: "docs", defaultValue: 50, disabled: true }),
      dragging(
        slider({
          id: "docs-range",
          defaultValue: [20, 80],
          orientation: "vertical",
        })
      ),
    ],
    samples: {
      root: [{}],
      control: [{}],
      track: [{}],
      indicator: [{}],
      thumb: [{ index: 0 }, { index: 1 }],
      value: [{}],
    },
    interactive: [],
    descriptions: {
      "data-orientation": {
        text: "The slider's axis.",
        values: ["horizontal", "vertical"],
      },
      "data-disabled": {
        text: "Present when disabled, by its own prop or a `<fieldset>`.",
      },
      "data-dragging": { text: "Present while a thumb is being dragged." },
      "thumb:data-dragging": {
        text: "Present while this thumb is being dragged.",
      },
      "data-index": { text: "Which value the thumb shows, from 0." },
    },
    parts: { root: { react: "Slider", web: "<ui-slider>" } },
  },
  resizable: {
    instances: () => [
      resizable({ id: "docs", disabled: true }),
      resizing(resizable({ id: "docs-drag", orientation: "vertical" })),
    ],
    samples: {
      root: [{}],
      panel: [{ id: "a", defaultSize: 30 }],
      handle: [{ id: "h" }, { id: "fixed", disabled: true }],
    },
    interactive: [],
    // Written as the layout changes and the pointer moves, without a render.
    extra: { panel: ["data-collapsed"], handle: ["data-hovering"] },
    descriptions: {
      "data-orientation": {
        text: "The group's direction, on every part. A handle's own `aria-orientation` is the other one, since it runs across the group.",
        values: ["horizontal", "vertical"],
      },
      "data-disabled": {
        text: "Present when the group, or this handle, is disabled.",
      },
      "data-dragging": {
        text: "Present while a handle of the group is being dragged.",
      },
      "handle:data-dragging": {
        text: "Present while this handle is being dragged.",
      },
      "data-collapsed": {
        text: "Present while a collapsible panel is collapsed.",
      },
      "data-hovering": {
        text: "Present while the pointer is over the handle or within its hit area, which reaches past the handle itself.",
      },
    },
    parts: { root: { react: "Resizable", web: "<ui-resizable>" } },
  },
  "number-input": {
    instances: () => [
      numberInput({
        id: "docs",
        defaultValue: 0,
        min: 0,
        disabled: true,
        readOnly: true,
        required: true,
      }),
    ],
    samples: {
      root: [{}],
      group: [{}],
      control: [{}],
      increment: [{}],
      decrement: [{}],
      "scrub-area": [{}],
      "scrub-area-cursor": [{}],
    },
    interactive: [],
    extra: {
      root: ["data-scrubbing"],
      group: ["data-scrubbing"],
      control: ["data-scrubbing"],
      increment: ["data-scrubbing"],
      decrement: ["data-scrubbing"],
      "scrub-area": ["data-scrubbing"],
      "scrub-area-cursor": ["data-scrubbing"],
    },
    descriptions: {
      "data-disabled": {
        text: "Present when disabled, by its own prop or a `<fieldset>`.",
      },
      "increment:data-disabled": {
        text: "Present when the button can't step: it or the field is disabled, the field is read-only, or the value is at `max`.",
      },
      "decrement:data-disabled": {
        text: "Present when the button can't step: it or the field is disabled, the field is read-only, or the value is at `min`.",
      },
      "data-readonly": { text: "Present when read-only." },
      "data-required": { text: "Present when required." },
      "data-scrubbing": {
        text: "Present while a drag on the scrub area changes the value.",
      },
      "scrub-area:data-orientation": {
        text: "Which way to drag.",
        values: ["horizontal", "vertical"],
      },
    },
    parts: { root: { react: "NumberInput", web: "<ui-number-input>" } },
  },
  avatar: {
    instances: () => [avatar({ id: "docs" })],
    samples: { root: [{}], image: [{}], fallback: [{}] },
    interactive: [],
    descriptions: {
      "data-loading-status": {
        text: "Where the image is: no image yet, loading, loaded, or failed.",
        values: ["idle", "loading", "loaded", "error"],
      },
    },
    parts: {
      root: { react: "Avatar", web: "<ui-avatar>" },
      image: { react: "AvatarImage", web: "<img>" },
    },
  },
  progress: {
    instances: () => [
      progress({ id: "docs", value: null }),
      progress({ id: "docs-progressing", value: 40 }),
      progress({ id: "docs-complete", value: 100 }),
    ],
    samples: {
      root: [{}],
      track: [{}],
      indicator: [{}],
      label: [{}],
      value: [{}],
    },
    interactive: [],
    descriptions: {
      "data-indeterminate": {
        text: "Present while the value is null: the task is under way, but how far is unknown.",
      },
      "data-progressing": { text: "Present while the value is below `max`." },
      "data-complete": { text: "Present once the value reaches `max`." },
    },
    parts: { root: { react: "Progress", web: "<ui-progress>" } },
  },
  "scroll-area": {
    instances: () => [scrollArea({ id: "docs" })],
    samples: {
      root: [{}],
      viewport: [{}],
      content: [{}],
      scrollbar: [
        { id: "vertical", orientation: "vertical" },
        { id: "horizontal", orientation: "horizontal" },
      ],
      thumb: [{ id: "vertical", orientation: "vertical" }],
      corner: [{}],
      "scroll-to-end": [{}],
    },
    interactive: [],
    // Measured in the page, or written while scrolling without a render.
    extra: {
      root: [
        "data-overflow-x",
        "data-overflow-y",
        "data-at-start",
        "data-at-end",
        "data-at-x-start",
        "data-at-x-end",
        "data-at-y-start",
        "data-at-y-end",
        "data-scrolling",
        "data-hovering",
        "data-sticking",
      ],
      viewport: [
        "data-overflow-y",
        "data-at-start",
        "data-at-end",
        "data-scrolling",
        "data-sticking",
      ],
      content: ["data-overflow-y", "data-at-start", "data-at-end"],
      scrollbar: [
        "data-visible",
        "data-scrolling",
        "data-hovering",
        "data-dragging",
        "data-overflow-y",
      ],
      thumb: ["data-dragging"],
      "scroll-to-end": ["data-visible"],
    },
    descriptions: {
      "data-orientation": {
        text: "The axis the scrollbar scrolls.",
        values: ["vertical", "horizontal"],
      },
      "data-overflow-x": {
        text: "Present while the content is wider than the viewport.",
      },
      "data-overflow-y": {
        text: "Present while the content is taller than the viewport.",
      },
      "data-at-start": {
        text: "Present while the view is at the start: the top, or the inline start when only the horizontal axis overflows. Also when nothing overflows.",
      },
      "data-at-end": {
        text: "Present while the view is at the end: the bottom, or the inline end when only the horizontal axis overflows.",
      },
      "data-at-x-start": {
        text: "Present while the view is at the inline start, within a pixel.",
      },
      "data-at-x-end": {
        text: "Present while the view is at the inline end, within a pixel.",
      },
      "data-at-y-start": {
        text: "Present while the view is at the top, within a pixel.",
      },
      "data-at-y-end": {
        text: "Present while the view is at the bottom, within a pixel.",
      },
      "data-scrolling": {
        text: "Present while the user scrolls, and for a moment after. Keeping the end in view doesn't count.",
      },
      "scrollbar:data-scrolling": {
        text: "Present while its own axis scrolls.",
      },
      "data-hovering": {
        text: "Present while a mouse or pen is over the scroll area.",
      },
      "data-sticking": {
        text: "Present while the view follows the end as content grows, with `stickToEnd`.",
      },
      "data-visible": {
        text: "Present while the scrollbar should show, by `type`. Hidden scrollbars let presses through.",
      },
      "scroll-to-end:data-visible": {
        text: "Present while the view is away from the end and not heading there. Otherwise the button is inert.",
      },
      "data-dragging": { text: "Present while the thumb is dragged." },
    },
    parts: { root: { react: "ScrollArea", web: "<ui-scroll-area>" } },
  },
  "otp-input": {
    instances: () => [
      otpInput({ id: "docs", defaultValue: "123456", disabled: true }),
      otpInput({ id: "docs-partial", defaultValue: "12" }),
    ],
    samples: {
      root: [{}],
      group: [{}],
      slot: [{ index: 0 }, { index: 3 }],
      separator: [{}],
    },
    interactive: [],
    // Focus decides which slot is active, and the samples are never focused.
    extra: {
      root: ["data-focused"],
      group: ["data-focused"],
      slot: ["data-active", "data-fake-caret"],
    },
    descriptions: {
      "data-focused": { text: "Present while the input has focus." },
      "data-complete": { text: "Present while every slot is filled." },
      "data-filled": { text: "Present while the code holds any character." },
      "slot:data-filled": { text: "Present while the slot holds a character." },
      "data-disabled": {
        text: "Present when disabled, by its own prop or a `<fieldset>`.",
      },
      "slot:data-active": {
        text: "Present on the slot typing goes to: the selected character, or the empty slot after the last one. Only while focused.",
      },
      "slot:data-fake-caret": {
        text: "Present on the active slot while it's empty. Draw a blinking caret in it; the input's own caret is hidden.",
      },
    },
    parts: {
      root: { react: "OTPInput", web: "<ui-otp-input>" },
      group: { react: "OTPInputGroup", web: "<ui-otp-input-group>" },
      slot: { react: "OTPInputSlot", web: "<ui-otp-input-slot>" },
      separator: {
        react: "OTPInputSeparator",
        web: "<ui-otp-input-separator>",
      },
    },
  },
  "date-input": {
    instances: () => [
      dateInput({
        id: "docs",
        defaultValue: "2026-11-02",
        disabled: true,
        readOnly: true,
        required: true,
      }),
      dateInput({
        id: "docs-invalid",
        defaultValue: "2026-12-02",
        max: "2026-11-30",
      }),
      dateInput({ id: "docs-empty" }),
    ],
    samples: {
      root: [{}],
      segment: [
        { segment: { key: "month" } as DateInputSegmentData },
        { segment: { key: "literal-0" } as DateInputSegmentData },
      ],
    },
    interactive: [],
    descriptions: segmentedDescriptions("date"),
    parts: {
      root: { react: "DateInput", web: "<ui-date-input>" },
      segment: { react: "DateInputSegment", web: "<ui-date-input-segment>" },
    },
  },
  "time-input": {
    instances: () => [
      timeInput({
        id: "docs",
        defaultValue: "14:30",
        disabled: true,
        readOnly: true,
        required: true,
      }),
      timeInput({ id: "docs-invalid", defaultValue: "18:00", max: "17:00" }),
      timeInput({ id: "docs-empty" }),
    ],
    samples: {
      root: [{}],
      segment: [
        { segment: { key: "hour" } as DateInputSegmentData },
        { segment: { key: "literal-0" } as DateInputSegmentData },
      ],
    },
    interactive: [],
    descriptions: segmentedDescriptions("time"),
    parts: {
      root: { react: "TimeInput", web: "<ui-time-input>" },
      segment: { react: "TimeInputSegment", web: "<ui-time-input-segment>" },
    },
  },
  "password-input": {
    instances: () => [
      passwordInput({ id: "docs" }),
      passwordInput({
        id: "docs-shown",
        defaultVisible: true,
        defaultValue: "hunter22",
        disabled: true,
        readOnly: true,
        required: true,
      }),
    ],
    samples: { root: [{}], control: [{}], toggle: [{}] },
    interactive: [],
    // Caps Lock is read from key events while the field has focus, which the samples never get.
    extra: {
      root: ["data-capslock"],
      control: ["data-capslock"],
      toggle: ["data-capslock"],
    },
    descriptions: {
      "data-visible": {
        text: "Present while the password is shown, so the field is a text field.",
      },
      "data-capslock": {
        text: "Present while Caps Lock is on and the field has focus.",
      },
      "data-filled": { text: "Present while the field holds any text." },
      "data-disabled": {
        text: "Present when disabled, by its own prop, a Field or a `<fieldset>`.",
      },
      "data-readonly": { text: "Present when the field is read-only." },
      "data-required": { text: "Present when a password is required." },
    },
    parts: {
      root: { react: "PasswordInput", web: "<ui-password-input>" },
      control: { react: "PasswordInputControl", web: "the <input> inside" },
      toggle: {
        react: "PasswordInputToggle",
        web: "<ui-password-input-toggle>",
      },
    },
  },
  listbox: {
    instances: () => [
      listbox({ id: "docs", defaultValue: "a" }),
      listbox({
        id: "docs-form",
        multiple: true,
        disabled: true,
        readOnly: true,
        required: true,
      }),
      listbox({ id: "docs-horizontal", orientation: "horizontal" }),
    ],
    samples: {
      root: [{}],
      item: [
        { id: "a", value: "a" },
        { id: "b", value: "b", disabled: true },
      ],
      "item-indicator": [{ id: "i", item: "a", keepMounted: true }],
      "item-icon": [{ id: "i", mirror: true }],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
    },
    interactive: [],
    // Focus decides the highlighted option, and the samples are never focused.
    extra: {
      item: ["data-highlighted", "data-has-icon"],
      root: ["data-has-icons"],
    },
    descriptions: {
      "data-orientation": {
        text: "Which arrow keys move between items.",
        values: ["vertical", "horizontal"],
      },
      "data-disabled": {
        text: "Present when the listbox is disabled, by its own prop, a Field or a `<fieldset>`.",
      },
      "item:data-disabled": {
        text: "Present when the item can't be chosen. It can still be focused.",
      },
      "data-readonly": { text: "Present when the listbox is read-only." },
      "data-required": { text: "Present when the listbox is required." },
      "data-selected": {
        text: "Present on selected items, and on the check inside them.",
      },
      "data-highlighted": { text: "Present on the item that has focus." },
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on an item while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any item inside holds an icon part, so items without one can line up.",
      },
    },
    parts: {
      root: { react: "Listbox", web: "<ui-listbox>" },
      item: { react: "ListboxItem", web: "<ui-listbox-item>" },
      "item-indicator": {
        react: "ListboxItemIndicator",
        web: "<ui-listbox-item-indicator>",
      },
      "item-icon": { react: "ListboxItemIcon", web: "<ui-listbox-item-icon>" },
      group: { react: "ListboxGroup", web: "<ui-listbox-group>" },
      "group-label": {
        react: "ListboxGroupLabel",
        web: "<ui-listbox-group-label>",
      },
      separator: { react: "ListboxSeparator", web: "<ui-listbox-separator>" },
    },
  },
  calendar: {
    instances: () => [
      calendar({
        id: "docs",
        today: "2026-10-16",
        defaultValue: "2026-10-16",
        unavailable: ["2026-10-24"],
      }),
      calendar({
        id: "docs-range",
        mode: "range",
        today: "2026-10-16",
        defaultValue: ["2026-10-14", "2026-10-18"],
        min: "2026-10-02",
        readOnly: true,
      }),
      calendar({ id: "docs-disabled", disabled: true }),
    ],
    samples: {
      root: [{}],
      previous: [{}],
      next: [{}],
      "month-select": [{}],
      "year-select": [{}],
      grid: [{ id: "0" }],
      day: [
        { value: "2026-10-01" },
        { value: "2026-10-14" },
        { value: "2026-10-16" },
        { value: "2026-10-18" },
        { value: "2026-10-24" },
        { value: "2026-09-30" },
      ],
    },
    interactive: [],
    // A range being picked previews until its end is chosen.
    extra: { day: ["data-preview"] },
    descriptions: {
      "data-mode": {
        text: "How the calendar selects.",
        values: ["single", "multiple", "range"],
      },
      "data-disabled": {
        text: "Present on the root, grids and selects when the calendar is disabled, on a day that can't be picked, and on Previous or Next at `min` or `max`.",
      },
      "data-readonly": {
        text: "Present when dates can be focused but not picked.",
      },
      "data-value": { text: "A day's ISO date." },
      "data-selected": {
        text: "Present on selected days. In a range, every day from start to end.",
      },
      "data-today": { text: 'Present on today, beside `aria-current="date"`.' },
      "data-outside": {
        text: "Present on a day of the month before or after its grid's.",
      },
      "data-unavailable": {
        text: "Present on a day `unavailable` names. It stays focusable.",
      },
      "data-range-start": {
        text: "Present on the day a range starts, including one being picked.",
      },
      "data-range-end": {
        text: "Present on the day a range ends, including one being picked.",
      },
      "data-range-middle": {
        text: "Present on the days inside a range, between its ends.",
      },
      "data-preview": {
        text: "Present on the days of a range being picked, from its start to the day under the pointer or focus.",
      },
    },
    parts: {
      root: { react: "Calendar", web: "<ui-calendar>" },
      previous: { react: "CalendarPrevious", web: "<ui-calendar-previous>" },
      next: { react: "CalendarNext", web: "<ui-calendar-next>" },
      "month-select": {
        react: "CalendarMonthSelect",
        web: "<ui-calendar-month-select>",
      },
      "year-select": {
        react: "CalendarYearSelect",
        web: "<ui-calendar-year-select>",
      },
      grid: { react: "CalendarGrid", web: "<ui-calendar-grid>" },
      day: { react: "CalendarDay", web: "<ui-calendar-day>" },
    },
  },
  "date-picker": {
    instances: () => [
      datePicker({
        id: "docs",
        today: "2026-10-16",
        defaultValue: "2026-10-16",
        defaultOpen: true,
      }),
      datePicker({ id: "docs-range", mode: "range", readOnly: true }),
      datePicker({ id: "docs-disabled", disabled: true }),
    ],
    samples: {
      root: [{}],
      input: [{ id: "start" }, { end: true, id: "end" }],
      trigger: [{}],
      content: [{}],
      hint: [{}],
      clear: [{}],
      preset: [
        { value: "2026-10-16", id: '"2026-10-16"' },
        { value: "2026-12-25", id: '"2026-12-25"' },
      ],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
    ],
    // Text that isn't a date marks the root and its input.
    extra: { root: ["data-invalid"], input: ["data-invalid"] },
    descriptions: {
      "data-mode": {
        text: "How the date picker selects.",
        values: ["single", "range"],
      },
      "data-open": { text: "Present while the popup is open." },
      "data-closed": {
        text: "Present while the popup is closed, including while it animates out.",
      },
      "data-disabled": { text: "Present when the date picker is disabled." },
      "data-readonly": {
        text: "Present when the date can be seen but not changed.",
      },
      "data-invalid": {
        text: "Present when an input holds text that isn't a date, or a date that can't be picked.",
      },
      "data-presentation": {
        text: "How the popup presents this time it's open.",
        values: ["popover", "sheet"],
      },
      "data-side": {
        text: "Where the popup ended up, after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the popup lines up with the input.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the popup animates out. Style the state you animate to.",
      },
      "data-empty": { text: "Present when there's no date to clear." },
      "data-selected": {
        text: "Present while the preset's value is the one selected.",
      },
    },
    parts: {
      root: { react: "DatePicker", web: "<ui-date-picker>" },
    },
  },
  pagination: {
    instances: () => [
      pagination({ id: "docs", pageCount: 10 }),
      pagination({ id: "docs-last", pageCount: 10, defaultPage: 10 }),
    ],
    samples: {
      root: [{}],
      list: [{}],
      item: [{}],
      link: [
        { page: 1, id: "1" },
        { page: 2, id: "2" },
      ],
      previous: [{}],
      next: [{}],
      first: [{}],
      last: [{}],
      ellipsis: [{}],
    },
    interactive: [],
    descriptions: {
      "link:data-current": {
        text: 'Present on the current page\'s link, beside `aria-current="page"`.',
      },
      "data-disabled": {
        text: "Present on a step at the end it goes to, beside `aria-disabled`. It stays focusable and does nothing.",
      },
    },
    parts: { root: { react: "Pagination", web: "<ui-pagination>" } },
  },
  carousel: {
    instances: () => [
      carousel({ id: "docs", defaultPage: 1, defaultPlaying: true }),
      carousel({ id: "docs-vertical", orientation: "vertical" }),
    ],
    samples: {
      root: [{}],
      viewport: [{}],
      content: [{}],
      item: [{ id: "a" }],
      previous: [{}],
      next: [{}],
      "indicator-group": [{}],
      indicator: [
        { id: "i1", page: 1 },
        { id: "i2", page: 2 },
      ],
      "play-toggle": [{}],
    },
    interactive: [],
    extra: {
      root: ["data-paused"],
      viewport: ["data-dragging"],
      item: ["data-active", "data-in-view"],
      "play-toggle": ["data-paused"],
    },
    descriptions: {
      "data-orientation": {
        text: "Which way the slides scroll, and which arrow keys page.",
      },
      "data-playing": { text: "Present while it rotates on its own." },
      "data-paused": {
        text: "Present while rotation is paused for now: hovered, the tab hidden, scrolled out of view or held. Pause a progress animation with it.",
      },
      "data-dragging": {
        text: "Present while a mouse or pen drags the slides.",
      },
      "data-active": { text: "Present on the slides of the current page." },
      "data-in-view": {
        text: "Present on slides at least half in view. Slides without it are inert and hidden from screen readers.",
      },
      "data-disabled": {
        text: "Present on Previous or Next when there's no page that way, beside `aria-disabled`. It stays focusable and does nothing.",
      },
      "data-selected": {
        text: "Present on the current page's indicator, beside `aria-selected`.",
      },
    },
    parts: { root: { react: "Carousel", web: "<ui-carousel>" } },
  },
  "field-set": {
    instances: () => [
      fieldSet({ id: "docs", disabled: true }),
      fieldSet({ id: "docs-enabled" }),
    ],
    samples: { set: [{}], legend: [{}], description: [{}] },
    interactive: [],
    descriptions: {
      "data-disabled": {
        text: "Present when the field set is disabled, by its own prop or a `<fieldset>` around it.",
      },
    },
    parts: {
      set: {
        react: "FieldSet",
        web: "<fieldset> in <ui-field-set>",
        slot: "field-set",
      },
      legend: {
        react: "FieldLegend",
        web: "<legend> or <ui-field-legend>",
        slot: "field-legend",
      },
      description: {
        react: "FieldDescription",
        web: "<ui-field-description>",
        slot: "field-description",
      },
    },
  },
  input: {
    instances: () => [input({ id: "docs", defaultValue: "Ada" })],
    samples: { root: [{ disabled: true, readOnly: true, required: true }] },
    interactive: [],
    descriptions: {
      "data-filled": { text: "Present while the field holds any text." },
      "data-disabled": {
        text: "Present when the field is disabled, by its own prop or its Field.",
      },
      "data-readonly": { text: "Present when the field is read-only." },
      "data-required": { text: "Present when the field is required." },
    },
    parts: { root: { react: "Input", web: "<input> in <ui-input>" } },
  },
  textarea: {
    instances: () => [textarea({ id: "docs", defaultValue: "Hello" })],
    samples: { root: [{ disabled: true, readOnly: true, required: true }] },
    interactive: [],
    descriptions: {
      "data-filled": { text: "Present while the field holds any text." },
      "data-disabled": {
        text: "Present when the field is disabled, by its own prop or its Field.",
      },
      "data-readonly": { text: "Present when the field is read-only." },
      "data-required": { text: "Present when the field is required." },
    },
    parts: { root: { react: "Textarea", web: "<textarea> in <ui-textarea>" } },
  },
  "input-group": {
    instances: () => {
      const group = inputGroup({ id: "docs" })
      group.api.internal.update({
        filled: true,
        disabled: true,
        readOnly: true,
      })
      return [group]
    },
    samples: { group: [{}], clear: [{}] },
    interactive: [],
    descriptions: {
      "data-filled": {
        text: "Present while the field in the group holds any text.",
      },
      "data-disabled": {
        text: "Present while the field in the group is disabled, by itself or a `<fieldset>`.",
      },
      "data-readonly": {
        text: "Present while the field in the group is read-only.",
      },
    },
    parts: {
      group: {
        react: "InputGroup",
        web: "<ui-input-group>",
        slot: "input-group",
      },
      clear: {
        react: "InputClear",
        web: "<ui-input-clear>",
        slot: "input-clear",
      },
    },
  },
  "file-input": {
    instances: () => [
      fileInput({
        id: "docs",
        disabled: true,
        required: true,
        defaultValue: [docsFile],
      }),
    ],
    samples: {
      root: [{}],
      trigger: [{}],
      dropzone: [{}],
      list: [{}],
      item: [{ file: docsFile, value: "docs" }],
      "item-remove": [{ file: docsFile, value: "docs" }],
    },
    interactive: [],
    extra: {
      root: ["data-dragging"],
      dropzone: ["data-dragging", "data-drag-accept", "data-drag-reject"],
    },
    descriptions: {
      "data-disabled": {
        text: "Present when disabled, by its own prop or a `<fieldset>`.",
      },
      "data-required": { text: "Present when a file is required." },
      "data-dragging": {
        text: "Present while files are dragged over one of its drop zones.",
      },
      "dropzone:data-dragging": {
        text: 'Present while files are dragged over the zone, or the window with `target="document"`.',
      },
      "data-drag-accept": {
        text: "Present while dragged files look acceptable, from their types and count.",
      },
      "data-drag-reject": {
        text: "Present while a dragged file has a type `accept` rules out, or there are too many.",
      },
    },
    parts: {
      root: { react: "FileInput", web: "<ui-file-input>" },
      trigger: {
        react: "FileInputTrigger",
        web: "the button inside <ui-file-input-trigger>",
      },
    },
  },
  dialog: {
    instances: () =>
      [false, true].flatMap((open) => [
        dialog({ id: "docs", defaultOpen: open }),
        dialog({ id: "docs", defaultOpen: open, modal: false }),
        pending(dialog({ id: "docs", defaultOpen: true })),
      ]),
    samples: {
      trigger: [{}, { disabled: true }],
      backdrop: [{}],
      content: [{}],
      title: [{}],
      description: [{}],
      close: [{}, { id: "pending" }],
      shortcut: [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "motion/presence.ts", slot: "backdrop" },
      { file: "platform/keyboard.ts", slot: "content" },
    ],
    descriptions: {
      ...DIALOG_DESCRIPTIONS,
      "data-presentation": {
        text: "How the dialog presents this time it's open.",
        values: ["dialog", "sheet"],
      },
    },
  },
  toast: {
    // A region showing a toast with a running action and an error toast, read
    // once and let go, so no timers keep running.
    instances: () =>
      [false, true].map((expanded) => {
        const toaster = createToaster({ overlays: createOverlays() })
        toaster("Saved", {
          id: "a",
          duration: Infinity,
          action: { label: "Undo", onAction: () => new Promise(() => {}) },
        })
        toaster.error("Failed", { id: "b", duration: Infinity })
        const region = toastRegion({ id: "docs", toaster, expanded })
        region.api.internal.connect()()
        press(region.part("action", { id: "pending", toast: "a" }))?.()
        return region
      }),
    samples: {
      region: [{}],
      root: [{ id: "a" }, { id: "b" }],
      title: [{ id: "a" }],
      description: [{ id: "a" }],
      action: [{ id: "pending", toast: "a" }],
      close: [{ id: "close", toast: "a" }],
    },
    interactive: [
      { file: "toast/toast.ts", slot: "root" },
      { file: "motion/presence.ts", slot: "root" },
      { file: "platform/keyboard.ts", slot: "region" },
    ],
    parts: {
      region: { react: "ToastRegion", web: "<ui-toast-region>" },
      root: { react: "Toast", web: "<ui-toast>" },
    },
    descriptions: {
      "data-side": {
        text: "The edge of the viewport the region sits on.",
        values: ["top", "bottom"],
      },
      "data-align": {
        text: "Where along that edge.",
        values: ["start", "center", "end"],
      },
      "data-expanded": {
        text: "Present while the stack is expanded: hovered, focused, or always with `expanded`.",
      },
      "data-type": {
        text: "What the toast is about.",
        values: ["default", "success", "error", "info", "warning", "loading"],
      },
      "data-front": {
        text: "Present on the newest toast, in front of a collapsed stack. A closing toast keeps it while it animates out.",
      },
      "data-swiping": { text: "Present while the toast is being swiped." },
      "data-swipe-direction": {
        text: "The direction a swipe dismissed the toast toward, while it animates out.",
        values: ["up", "down", "left", "right"],
      },
      "data-pending": {
        text: "Present on an action or close button while its handler's Promise runs.",
      },
      "data-keyboard": {
        text: "Present on the region while the on-screen keyboard covers part of the page.",
      },
      "data-starting-style": {
        text: "Present for a toast's first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while a toast animates out. Style the state you animate to.",
      },
    },
  },
  drawer: {
    // Closed and open, open where the page stays usable, and with a Close action running.
    instances: () => [
      drawer({ id: "docs" }),
      drawer({ id: "docs", defaultOpen: true }),
      drawer({
        id: "docs",
        defaultOpen: true,
        snapPoints: [0.2, 0.6],
        modalAbove: 0.2,
      }),
      pending(drawer({ id: "docs", defaultOpen: true })),
    ],
    samples: {
      trigger: [{}, { disabled: true }],
      backdrop: [{}],
      viewport: [{}],
      content: [{}],
      handle: [{}],
      title: [{}],
      description: [{}],
      close: [{}, { id: "pending" }],
      shortcut: [{}],
      outlet: [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "motion/presence.ts", slot: "backdrop" },
      { file: "popups/sheet.ts", slot: "content" },
      { file: "platform/keyboard.ts", slot: "viewport" },
    ],
    // Written while a finger drags it, or once the sheet has measured its snap points.
    extra: {
      content: ["data-expanded", "data-dragging"],
      backdrop: ["data-dragging"],
      handle: ["data-expanded"],
    },
    parts: {
      viewport: { react: "Viewport", web: "<ui-drawer-viewport>" },
    },
    descriptions: {
      ...DIALOG_DESCRIPTIONS,
      "data-open": {
        text: "Present while the drawer is open. On a trigger, while it's open from that trigger.",
      },
      "data-closed": {
        text: "Present while the drawer is closed, including while it animates out.",
      },
      "data-nested": {
        text: "Present when the drawer was opened from inside another drawer.",
      },
      "data-nested-open": {
        text: "Present while a drawer opened from inside this one is open.",
      },
      "data-side": {
        text: "The edge it comes from, with `start` and `end` resolved for the writing direction.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-snap-point": {
        text: "The snap point it rests on or is moving to, as written, like `0.5` or `content`.",
      },
      "data-expanded": {
        text: "Present while it rests at its largest snap point.",
      },
      "data-dragging": {
        text: "Present while a finger, mouse or pen drags it.",
      },
      "data-interactive": {
        text: "Present while it rests at or below `modalAbove`, so the page behind is usable. The backdrop lets presses through.",
      },
      "data-driver": {
        text: "What moves it.",
        values: ["pointer", "scroll-snap"],
      },
      "data-keyboard": {
        text: "Present on the viewport while the on-screen keyboard covers part of the page.",
      },
      "data-starting-style": {
        text: "Present for the first frame. The drawer slides itself, so leave the content's translate and the backdrop's opacity alone.",
      },
      "data-ending-style": { text: "Present while the drawer animates out." },
    },
  },
  "alert-dialog": {
    instances: () =>
      [false, true].flatMap((open) => [
        alertDialog({ id: "docs", defaultOpen: open }),
        pending(alertDialog({ id: "docs", defaultOpen: true })),
      ]),
    samples: {
      trigger: [{}, { disabled: true }],
      backdrop: [{}],
      content: [{}],
      title: [{}],
      description: [{}],
      close: [{}, { id: "pending" }],
      shortcut: [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "motion/presence.ts", slot: "backdrop" },
      { file: "platform/keyboard.ts", slot: "content" },
    ],
    descriptions: DIALOG_DESCRIPTIONS,
  },
  popover: {
    instances: () =>
      [false, true].map((open) => popover({ id: "docs", defaultOpen: open })),
    samples: {
      trigger: [{}, { disabled: true }],
      content: [{}],
      title: [{}],
      description: [{}],
      close: [{}],
      arrow: [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
    ],
    descriptions: {
      "data-presentation": {
        text: "How the popover presents this time it's open.",
        values: ["popover", "sheet"],
      },
      "data-open": {
        text: "Present while the popover is open. On a trigger, while it's open from that trigger.",
      },
      "data-closed": {
        text: "Present while the popover is closed, including while it animates out.",
      },
      "trigger:data-disabled": {
        text: "Present when the trigger is disabled.",
      },
      "data-side": {
        text: "Where the popover ended up, after flipping away from edges. Set on the arrow too.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the popover lines up with its trigger.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the popover animates out. Style the state you animate to.",
      },
      "data-arrow-clamped": {
        text: "Present on the arrow when it stops short of the middle of the trigger, held back by `arrowPadding`.",
      },
    },
  },
  tooltip: {
    instances: () =>
      [false, true].map((open) => tooltip({ id: "docs", defaultOpen: open })),
    samples: {
      trigger: [{}],
      content: [{}],
      arrow: [{}],
      shortcut: [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
    ],
    descriptions: {
      "data-open": { text: "Present while the tooltip is open." },
      "data-closed": {
        text: "Present while the tooltip is closed, including while it animates out.",
      },
      "data-side": {
        text: "Where the tooltip ended up, after flipping away from edges. Set on the arrow too.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the tooltip lines up with its trigger.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the tooltip animates out. Style the state you animate to.",
      },
      "data-arrow-clamped": {
        text: "Present on the arrow when it stops short of the middle of the trigger, held back by `arrowPadding`.",
      },
    },
  },
  "hover-card": {
    instances: () =>
      [false, true].map((open) => hoverCard({ id: "docs", defaultOpen: open })),
    samples: {
      trigger: [{}],
      content: [{}],
      arrow: [{}],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
    ],
    descriptions: {
      "data-open": {
        text: "Present while the card is open. On a trigger, while it's open from that trigger.",
      },
      "data-closed": {
        text: "Present while the card is closed, including while it animates out.",
      },
      "data-side": {
        text: "Where the card ended up, after flipping away from edges. Set on the arrow too.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the card lines up with its trigger.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the card animates out. Style the state you animate to.",
      },
      "data-arrow-clamped": {
        text: "Present on the arrow when it stops short of the middle of the trigger, held back by `arrowPadding`.",
      },
    },
  },
  "navigation-menu": {
    instances: () => {
      const closed = navigationMenu({ id: "docs" })
      return [
        closed,
        navigationMenu({
          id: "docs-open",
          defaultValue: "a",
          orientation: "vertical",
        }),
        // A submenu, for attributes only nested menus have.
        navigationMenu({
          id: "docs-sub",
          parent: { api: closed.api, item: "a" },
        }),
      ]
    },
    samples: {
      root: [{}],
      list: [{}],
      item: [{ value: "a" }, { value: "b" }],
      trigger: [{ value: "a" }, { value: "b", disabled: true }],
      content: [{ value: "a" }],
      link: [{ id: "l" }, { id: "m", active: true }],
      viewport: [{}],
      indicator: [{}],
      "link-icon": [{ id: "i", mirror: true }],
    },
    parts: { root: { react: "NavigationMenu", web: "<ui-navigation-menu>" } },
    interactive: [
      { file: "motion/presence.ts", slot: "viewport" },
      { file: "motion/presence.ts", slot: "content" },
      { file: "navigation-menu/navigation-menu-dom.ts", slot: "indicator" },
    ],
    extra: {
      viewport: ["data-side", "data-align"],
      content: ["data-motion", "data-side", "data-align"],
      link: ["data-has-icon"],
      list: ["data-has-icons"],
    },
    descriptions: {
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on a link while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any link inside holds an icon part, so items without one can line up.",
      },
      "data-orientation": {
        text: "Which arrow keys move between the items, and where panels open.",
      },
      "root:data-nested": {
        text: "Present on a menu inside another menu's content.",
      },
      "data-open": { text: "Present while the item's panel is open." },
      "data-closed": {
        text: "Present while the item's panel is closed, including while it animates out.",
      },
      "viewport:data-open": { text: "Present while a panel is open." },
      "viewport:data-closed": {
        text: "Present while every panel is closed, including while it animates out.",
      },
      "indicator:data-open": {
        text: "Present while a panel is open, so it sits under a trigger.",
      },
      "indicator:data-closed": { text: "Present while every panel is closed." },
      "indicator:data-visible": {
        text: "Present while there's a trigger or a current page's link to sit under.",
      },
      "trigger:data-disabled": {
        text: "Present when the trigger is disabled.",
      },
      "data-current": {
        text: "Present on the link for the current page, which also gets aria-current.",
      },
      "data-motion": {
        text: "Which way the content moves while another item takes over. Order is logical, so in right-to-left layouts the end is on the left.",
        values: ["from-start", "from-end", "to-start", "to-end"],
      },
      "data-side": {
        text: "Where the viewport, or a content without one, ended up after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How it lines up with the trigger.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while it animates out. Style the state you animate to.",
      },
    },
  },
  "trigger-menu": {
    instances: () => [triggerMenu({ id: "docs", triggers: [] })],
    samples: {
      input: [{}],
      content: [{}],
      list: [{}],
      item: [
        { id: "a", value: "a" },
        { id: "b", value: "b", disabled: true },
      ],
      group: [{ id: "g" }],
      "group-label": [{ group: "g" }],
      separator: [{}],
      empty: [{}],
      status: [{}],
      hint: [{}],
      "item-icon": [{ id: "i", mirror: true }],
    },
    interactive: [
      { file: "motion/presence.ts", slot: "content" },
      { file: "platform/position.ts", slot: "content" },
    ],
    extra: {
      input: ["data-open", "data-trigger"],
      content: ["data-open", "data-trigger", "data-has-icons"],
      item: ["data-highlighted", "data-has-icon"],
      empty: ["data-empty", "data-loading"],
    },
    descriptions: {
      "data-mirror": {
        text: "Present on an icon that flips in right-to-left text, with `mirror`.",
      },
      "data-has-icon": {
        text: "Present on an item while it holds an icon part.",
      },
      "data-has-icons": {
        text: "Present while any item inside holds an icon part, so items without one can line up.",
      },
      "data-open": { text: "Present while the list is open." },
      "data-closed": {
        text: "Present while the list is closed, including while it animates out.",
      },
      "data-trigger": {
        text: "The trigger of the current match, like `@`, while there is one.",
      },
      "data-disabled": { text: "Present when the item can't be chosen." },
      "data-highlighted": {
        text: "Present on the highlighted item. Focus stays in the field.",
      },
      "data-empty": { text: "Present while no item matches." },
      "data-loading": { text: "Present while items load." },
      "data-side": {
        text: "Where the list ended up, after flipping away from edges.",
        values: ["top", "right", "bottom", "left"],
      },
      "data-align": {
        text: "How the list lines up with the trigger.",
        values: ["start", "center", "end"],
      },
      "data-starting-style": {
        text: "Present for the first frame. Style the state you animate from.",
      },
      "data-ending-style": {
        text: "Present while the list animates out. Style the state you animate to.",
      },
    },
  },
  "token-input": {
    instances: () => [
      tokenInput({
        id: "docs",
        defaultValue: [
          { type: "file", value: "a", label: "a", id: "t", status: "pending" },
        ],
      }),
      tokenInput({ id: "docs-disabled", disabled: true, readOnly: true }),
    ],
    samples: {
      editor: [{}],
      token: [{ id: "t", token: "t" }],
      "token-remove": [{ id: "t", token: "t" }],
    },
    interactive: [{ file: "token-input/token-input-view.ts", slot: "token" }],
    extra: { token: ["data-selected", "data-unresolved"] },
    descriptions: {
      "data-empty": {
        text: "Present while the input holds nothing. Show the placeholder with it.",
      },
      "data-disabled": {
        text: "Present when the input is disabled, by its own prop, a field or a `<fieldset>`.",
      },
      "data-readonly": { text: "Present when the input is read-only." },
      "data-token-type": {
        text: "The token's type, like `file` or `mention`. Also on its host.",
      },
      "data-pending": {
        text: "Present while the token loads. Also on its host.",
      },
      "data-unresolved": {
        text: "Present while the token needs the user, like an ambiguous mention. Also on its host.",
      },
      "data-selected": {
        text: "Present while the token is in the selection, or selected for removal. Also on its host.",
      },
    },
  },
}

async function collect(component: string) {
  const { instances, samples, interactive, extra = {} } = components[component]
  const found = new Map<string, Map<string, Set<string>>>()
  const add = (slot: string, name: string, value: string) => {
    const attrs = found.get(slot) ?? new Map<string, Set<string>>()
    const values = attrs.get(name) ?? new Set<string>()
    values.add(value)
    attrs.set(name, values)
    found.set(slot, attrs)
  }
  for (const instance of instances()) {
    for (const [slot, propsList] of Object.entries(samples)) {
      for (const props of propsList) {
        for (const [name, value] of Object.entries(
          partAttrs(instance.part(slot, props))
        )) {
          if (
            name.startsWith("data-") &&
            name !== "data-slot" &&
            value !== undefined
          ) {
            add(slot, name, value)
          }
        }
      }
    }
  }
  for (const { file, slot } of interactive) {
    const source = await readFile(coreSource(file), "utf8")
    for (const match of source.matchAll(/setAttribute\("(data-[\w-]+)"/g)) {
      add(slot, match[1], "")
    }
  }
  for (const [slot, names] of Object.entries(extra)) {
    for (const name of names) {
      add(slot, name, "")
    }
  }
  return found
}

const pascal = (slot: string) =>
  slot.replace(/(^|-)(\w)/g, (_, __, char: string) => char.toUpperCase())

/** A part's name in `framework`, like `AccordionPanel` or `<ui-accordion-panel>`. */
function partLabel(component: string, slot: string, framework: Framework) {
  const part = components[component]?.parts?.[slot]
  return framework === "web-components"
    ? (part?.web ?? `<ui-${component}-${slot}>`)
    : (part?.react ?? `${pascal(component)}${pascal(slot)}`)
}

/**
 * A component's styling hooks per part: its name in `framework`, its
 * `data-slot`, and each data attribute with its values and meaning. `plain`
 * names the parts with no state attributes.
 */
async function dataAttributeTables(component: string, framework: Framework) {
  const found = await collect(component)
  const { samples, descriptions, parts = {} } = components[component]
  const name = (slot: string) => partLabel(component, slot, framework)
  const dataSlot = (slot: string) =>
    parts[slot]?.slot ?? (slot === "root" ? component : `${component}-${slot}`)
  const slots = Object.keys(samples)
  return {
    styled: slots
      .filter((slot) => found.get(slot)?.size)
      .map((slot) => ({
        slot,
        name: name(slot),
        dataSlot: dataSlot(slot),
        attributes: [...found.get(slot)!.entries()].map(
          ([attribute, sampled]) => {
            const description =
              descriptions[`${slot}:${attribute}`] ?? descriptions[attribute]
            return {
              attribute,
              values: description?.values ?? [...sampled].filter(Boolean),
              text: description?.text,
            }
          }
        ),
      })),
    plain: slots
      .filter((slot) => !found.get(slot)?.size)
      .map((slot) => ({ slot, name: name(slot), dataSlot: dataSlot(slot) })),
  }
}

/** The state each sampled instance hands one part's render and style functions. */
function partStates(component: string, slot: string) {
  const { instances, samples } = components[component]
  return instances().flatMap((instance) =>
    (samples[slot] ?? []).map((props) => partState(instance.part(slot, props)))
  )
}

/** Whether `component` has a data attributes table. */
const hasDataAttributes = (component: string) => component in components

export { dataAttributeTables, hasDataAttributes, partLabel, partStates }

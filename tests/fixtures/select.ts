import { presentationOption } from "./presentation"

// The select every implementation renders. Labels, values and order are the
// contract the specs rely on, so change them here and nowhere else.
//
// Before
// <form "Order">
//   Label "Fruit", the trigger (a combobox named "Fruit"), Clear
//   The list: Apple, Banana, Blueberry, Cherry, Grape (disabled), Lemon, Mango,
//   Orange. With ?grouped: "Fruits" (Apple, Banana, Orange) and "Vegetables"
//   (Carrot, Lettuce, Pepper), split by a separator.
//   Submit, Reset
// </form>
// After
// Status "Last action": "value:<value>", for the last value change
// Status "Submitted": what the form submitted, as a query string
// Open with controller
//
// With ?search, the list starts with a search field named "Search fruits",
// its items are in a list part, labels mark what matched, and "No fruits
// found" shows when nothing does. With ?select-all and ?multiple, an option
// "Select all" comes first, and "Select all <group>" in each group with
// ?grouped. With ?recent, "Recent" (Mango, Cherry) shows while the search is
// empty. ?max=2 shows two labels in the trigger and counts the rest.
const selectFixture = {
  label: "Fruit",
  name: "fruit",
  placeholder: "Pick a fruit",
  formLabel: "Order",
  clear: "Clear",
  search: "Search fruits",
  empty: "No fruits found",
  selectAll: "Select all",
  recent: [
    {
      type: "group" as const,
      label: "Recent",
      items: [
        { value: "mango", label: "Mango" },
        { value: "lemon", label: "Lemon" },
      ],
    },
  ],
  items: [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry" },
    { value: "grape", label: "Grape", disabled: true },
    { value: "lemon", label: "Lemon" },
    { value: "mango", label: "Mango" },
    { value: "orange", label: "Orange" },
  ],
  groups: [
    {
      label: "Fruits",
      items: [
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
        { value: "orange", label: "Orange" },
      ],
    },
    {
      label: "Vegetables",
      items: [
        { value: "carrot", label: "Carrot" },
        { value: "lettuce", label: "Lettuce" },
        { value: "pepper", label: "Pepper" },
      ],
    },
  ],
}

// Options a spec can set through the URL:
// ?value=banana selects Banana at first (comma-separated with ?multiple),
// ?multiple, ?grouped, ?required, ?readonly, ?disabled, ?open, ?modal=true|false,
// ?align (the selected item over the trigger), ?cancel cancels value changes,
// ?container=id renders the list there, ?long renders 10,000 items as data,
// ?fieldset puts the select in a disabled fieldset, and ?search, ?select-all,
// ?recent and ?max=<count> are described above.
function selectOptions() {
  const params = new URLSearchParams(location.search)
  const multiple = params.has("multiple")
  const value = params.get("value")
  const modal = params.get("modal")
  const container = params.get("container")
  const max = params.get("max")
  return {
    search: params.has("search"),
    selectAll: params.has("select-all"),
    recent: params.has("recent"),
    ...(max && { max: Number(max) }),
    multiple,
    ...(value !== null && {
      defaultValue: multiple ? value.split(",").filter(Boolean) : value,
    }),
    grouped: params.has("grouped"),
    required: params.has("required"),
    readOnly: params.has("readonly"),
    disabled: params.has("disabled"),
    ...(params.has("open") && { defaultOpen: true }),
    ...(modal && { modal: modal === "true" }),
    align: params.has("align"),
    cancel: params.has("cancel"),
    long: params.has("long"),
    fieldset: params.has("fieldset"),
    // The label and trigger outside the select, ahead of it, in a Field: the
    // trigger connects through the controller.
    field: params.has("field"),
    ...(container && { container: document.getElementById(container) }),
    ...presentationOption(),
  }
}

// A long list for performance specs: Item 1 to Item 10000.
function longItems(count = 10_000) {
  return Array.from({ length: count }, (_, index) => ({
    value: `item-${index + 1}`,
    label: `Item ${index + 1}`,
  }))
}

// What a form would submit, as a query string.
function serializeForm(form: HTMLFormElement) {
  return new URLSearchParams(
    new FormData(form) as unknown as Record<string, string>
  ).toString()
}

// The rows a virtualized list renders: the visible ones plus a few either side.
function visibleRows(
  scrollTop: number,
  height: number,
  count: number,
  row: number,
  overscan = 4
) {
  const start = Math.max(0, Math.floor(scrollTop / row) - overscan)
  const end = Math.min(count, Math.ceil((scrollTop + height) / row) + overscan)
  return { start, end }
}

// The scroll position that shows a row, or the current one when it's in view.
function scrollForRow(
  index: number,
  scrollTop: number,
  height: number,
  row: number
) {
  const top = index * row
  if (top < scrollTop) {
    return top
  }
  if (top + row > scrollTop + height) {
    return top + row - height
  }
  return scrollTop
}

// The items a spec swaps in while the list is open, with `changeItems`.
// "reversed" lists the items backwards. "replaced" keeps Banana and Cherry as
// new objects, drops the rest, adds Kiwi and Peach, and shuffles them.
const changedItems = {
  reversed: [...selectFixture.items].reverse(),
  replaced: [
    { value: "peach", label: "Peach" },
    { value: "cherry", label: "Cherry" },
    { value: "kiwi", label: "Kiwi" },
    { value: "banana", label: "Banana" },
  ],
}

export {
  changedItems,
  longItems,
  scrollForRow,
  selectFixture,
  selectOptions,
  serializeForm,
  visibleRows,
}

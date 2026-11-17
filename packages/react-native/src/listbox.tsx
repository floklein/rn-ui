import {
  listbox,
  type ListboxItemProps,
  type ListboxItemState,
  type ListboxOptions,
  type ListboxPrimitive,
  type ListboxState,
  type ListData,
} from "@ui-sdk/core/listbox"
import { focusListboxItem, listboxNative } from "@ui-sdk/core/native"
import * as React from "react"
import { Pressable, Text, View } from "react-native"
import { itemLabel, notLabel } from "./children"
import { useFieldControl } from "./field-context"
import { mergeProps } from "./render-element"
import {
  createParts,
  type PartProps,
  type Parts,
  useAround,
  useHandle,
  usePart,
  usePrimitive,
} from "./use-primitive"

type ListboxParts = Parts<
  ListboxPrimitive,
  {
    "item-indicator": typeof View
    "item-icon": typeof View
    group: typeof View
    "group-label": typeof Text
    separator: typeof View
  }
>

const parts: ListboxParts = createParts(
  listbox,
  {
    "item-indicator": View,
    "item-icon": View,
    group: View,
    "group-label": Text,
    separator: View,
  },
  listboxNative
)

type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Listbox`.
 * @experimental
 */
type ListboxProps<
  T = string,
  Multiple extends boolean | undefined = false,
> = Omit<PartProps<typeof View, ListboxState>, Clashing> &
  ListboxOptions<T, Multiple> & {
    name?: never
    form?: never
  }

/**
 * An always-visible list to choose one option from, or several, in a
 * `View`. Each option is its own accessible element, reached by swiping. `T`
 * is inferred from `value`, `defaultValue`, `items` or `onValueChange`, and
 * `multiple` makes the value a list, where a press toggles an option.
 * @experimental
 */
function Listbox<T = string, Multiple extends boolean | undefined = false>({
  value,
  defaultValue,
  onValueChange,
  multiple,
  activation,
  deselectable,
  orientation,
  loop,
  keepInView,
  items,
  itemToValue,
  isItemEqualToValue,
  onHighlight,
  disabled,
  readOnly,
  required,
  controller,
  debug,
  children,
  ...props
}: ListboxProps<T, Multiple>) {
  const handle = usePrimitive(
    listbox,
    {
      value,
      defaultValue,
      onValueChange,
      multiple,
      activation,
      deselectable,
      orientation,
      loop,
      keepInView,
      items,
      itemToValue,
      isItemEqualToValue,
      onHighlight,
      disabled,
      readOnly,
      required,
      controller,
      debug,
    } as ListboxOptions<any, any>,
    listboxNative
  )
  const field = useFieldControl(props as Record<string, unknown>, () =>
    handle.api.focus()
  )
  const content = (state: ListboxState, interaction: never) =>
    typeof children === "function"
      ? children(state, interaction)
      : (children ?? (items && <ListboxItems items={state.items} />))
  return usePart(
    handle,
    "root",
    {},
    { ...field, children: content } as Record<string, unknown>,
    View
  )
}

type ItemPartProps<T> = Omit<
  PartProps<typeof Pressable, ListboxItemState>,
  Clashing
> &
  ListboxItemProps<T>

/**
 * An option: a `Pressable`, its own accessible element, selected while its
 * value is in the listbox's value. Pressing it selects it, or toggles it with
 * `multiple`. Its label is its text, or `label`. It's highlighted while it
 * has keyboard focus.
 * @experimental
 */
function ListboxItem<T = string>({
  value,
  label,
  disabled,
  index,
  children,
  ...props
}: ItemPartProps<T>) {
  const handle = useHandle(listbox)
  const key = handle.api.internal.keyOf(value)
  const group = useAround(listbox, "group")?.id as string | undefined
  const focus = (focused: boolean) => () =>
    focusListboxItem(
      handle.instance.part("item", { id: key, value }, true),
      focused
    )
  return usePart(
    listbox,
    "item",
    {
      id: key,
      value,
      label: itemLabel(label, children),
      disabled,
      index,
      group,
    } as never,
    mergeProps(
      { onFocus: focus(true), onBlur: focus(false) },
      { ...props, children }
    ),
    Pressable
  )
}

/**
 * The check inside a selected item, a `View`. Rendered while it's selected,
 * or always with `keepMounted`. Hidden from screen readers. Pass `onExit` to
 * keep it mounted while it animates out.
 * @experimental
 */
const ListboxItemIndicator = notLabel(
  parts.ItemIndicator
) as ListboxParts["ItemIndicator"]

/**
 * An icon inside an item, a `View`. Screen readers skip it, and `mirror`
 * flips it when the app runs right to left.
 * @experimental
 */
const ListboxItemIcon = notLabel(parts.ItemIcon) as ListboxParts["ItemIcon"]

/**
 * A group of items, a `View`, named by its `ListboxGroupLabel`.
 * @experimental
 */
const ListboxGroup: ListboxParts["Group"] = parts.Group

/**
 * The group's heading, a `Text`, which names the group.
 * @experimental
 */
const ListboxGroupLabel: ListboxParts["GroupLabel"] = parts.GroupLabel

/**
 * A line between items or groups, a `View` hidden from screen readers.
 * @experimental
 */
const ListboxSeparator: ListboxParts["Separator"] = parts.Separator

/**
 * Renders data items. Used by data listboxes, and available for custom
 * layouts.
 * @experimental
 */
function ListboxItems({ items }: { items: ListData<unknown> }) {
  const handle = useHandle(listbox)
  return renderItems(items, handle.api.internal.keyOf)
}

// check-code: allow return-type recursive, so TypeScript cannot infer it.
function renderItems(
  items: readonly ListData<any>[number][],
  keyOf: (value: unknown) => string
): React.ReactNode {
  return items.map((entry, index) => {
    if (typeof entry === "string") {
      return (
        <ListboxItem key={entry} value={entry}>
          <Text>{entry}</Text>
        </ListboxItem>
      )
    }
    if ("type" in entry && entry.type === "separator") {
      return <ListboxSeparator key={`separator-${index}`} />
    }
    if ("type" in entry && entry.type === "group") {
      return (
        <ListboxGroup key={`group-${entry.label ?? index}`}>
          {entry.label && <ListboxGroupLabel>{entry.label}</ListboxGroupLabel>}
          {renderItems(entry.items, keyOf)}
        </ListboxGroup>
      )
    }
    const { value, label, disabled } = entry as {
      value: unknown
      label: string
      disabled?: boolean
    }
    return (
      <ListboxItem
        key={keyOf(value)}
        value={value}
        label={label}
        disabled={disabled}
      >
        <Text>{label}</Text>
      </ListboxItem>
    )
  })
}

export { createListboxController } from "@ui-sdk/core/listbox"
export type {
  ListData,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  ListboxApi,
  ListboxChangeOptions,
  ListboxController,
  ListboxItemIconProps,
  ListboxItemIconState,
  ListboxItemIndicatorProps,
  ListboxItemIndicatorState,
  ListboxItemProps,
  ListboxItemState,
  ListboxOptions,
  ListboxPrimitive,
  ListboxState,
  ListboxValue,
  ListboxValueChangeReason,
} from "@ui-sdk/core/listbox"

export {
  Listbox,
  ListboxGroup,
  ListboxGroupLabel,
  ListboxItem,
  ListboxItemIcon,
  ListboxItemIndicator,
  ListboxItems,
  type ListboxProps,
  ListboxSeparator,
}

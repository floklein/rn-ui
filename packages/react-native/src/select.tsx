import { pressSelectTrigger, selectNative } from "@ui-sdk/core/native"
import {
  type PresenceState,
  selectAllKey,
  selectItemIcons,
  selectSelectAll,
} from "@ui-sdk/core/renderer"
import {
  type ListData,
  select,
  type SelectArrowState,
  type SelectContentProps,
  type SelectContentState,
  type SelectEmptyState,
  type SelectItemIconProps,
  type SelectItemIconState,
  type SelectItemProps,
  type SelectItemState,
  type SelectItemTextState,
  type SelectOptions,
  type SelectPrimitive,
  type SelectSelectAllState,
  type SelectTriggerProps,
  type SelectTriggerState,
  type SelectValueProps,
  type SelectValueState,
} from "@ui-sdk/core/select"
import * as React from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import {
  hasChild,
  itemLabel,
  learnLabels,
  notLabel,
  Placed as PlacedProvider,
  usePlaceContent,
  usePlacedContent,
} from "./children"
import { useControllerEntry, useControllerTarget } from "./controller-target"
import { useFieldControl } from "./field-context"
import { layerInput, pressSource } from "./native-host"
import { landIn, useHost } from "./overlay-host"
import {
  fromLeft,
  type NativeAnchor,
  placementOf,
  usePlaced,
  usePlacement,
} from "./placement"
import {
  createOutlet,
  type Outlet,
  OutletContext,
  PopupLayer,
  useOutlet,
} from "./popup-parts"
import { mergeProps, renderElement, withState } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useAround,
  useHandle,
  useNearest,
  usePart,
  usePressedPart,
  usePrimitive,
} from "./use-primitive"

type SelectParts = Parts<
  SelectPrimitive,
  {
    label: typeof Text
    status: typeof View
    "item-indicator": typeof View
    group: typeof View
    "group-label": typeof Text
    separator: typeof View
    clear: typeof Pressable
  }
>

const parts: SelectParts = createParts(
  select,
  {
    label: Text,
    status: View,
    "item-indicator": View,
    group: View,
    "group-label": Text,
    separator: View,
    clear: Pressable,
  },
  selectNative
)

/**
 * The fields placement adds to the content's state, as the web's CSS
 * variables and data attributes. Undefined until it's first placed.
 * @experimental
 */
type SelectPlacementState = {
  /** The side it opened on, after flipping. */
  side?: "top" | "right" | "bottom" | "left"
  /** How it lines up with the trigger. */
  align?: "start" | "center" | "end"
  /** The width of the trigger, or of the anchor it's placed against. */
  anchorWidth?: number
  /** The height of the trigger, or of the anchor it's placed against. */
  anchorHeight?: number
  /** The width it has before reaching the edge of the space it may use. */
  availableWidth?: number
  /** The height it has before reaching the edge of the space it may use, for a list that scrolls past it. */
  availableHeight?: number
  /** The point facing the trigger, as a `transformOrigin` style, like `"0px 0px"`. */
  transformOrigin?: string
  /** Where the trigger's center falls along the edge facing it, kept clear of the corners. */
  arrowOffset?: number
}

/**
 * The fields placement adds to the arrow's state.
 * @experimental
 */
type SelectArrowPlacementState = {
  /** The side the list opened on. */
  side?: "top" | "right" | "bottom" | "left"
  /** How the list lines up with the trigger. */
  align?: "start" | "center" | "end"
  /** Whether the arrow stopped short of the trigger's center at a corner. */
  arrowClamped?: boolean
}

type Clashing = "value" | "defaultValue" | "onChange" | "onSelect"

/**
 * The props of `Select`.
 * @experimental
 */
type SelectProps<
  T = string,
  Multiple extends boolean | undefined = false,
> = SelectOptions<T, Multiple> & {
  /**
   * `true` or `"pointer"` renders the list in a `Modal`, which hides the rest
   * of the screen from screen readers, and a press outside only closes it.
   * `false` renders it in the app's `OverlayHost`, and a press outside closes
   * it and reaches what's under it.
   * @defaultValue "pointer"
   */
  modal?: boolean | "pointer"
  container?: never
  name?: never
  form?: never
  autoComplete?: never
  children?: React.ReactNode
}

/**
 * Picks one value, or several, from a list in a popup. `T` is inferred from
 * `value`, `defaultValue`, `items` or `onValueChange`, and `multiple` makes
 * the value a list. A non-modal select renders its list in the app's
 * `OverlayHost`; by default it renders it in a `Modal`.
 * @experimental
 */
function Select<T = string, Multiple extends boolean | undefined = false>({
  children,
  ...options
}: SelectProps<T, Multiple>) {
  const handle = usePrimitive(
    select,
    options as SelectOptions<any, any>,
    selectNative
  )
  useControllerEntry(options.controller, handle)
  learnLabels(handle.api.internal, children)
  const [outlet] = React.useState(createOutlet)
  // A data select renders its list, unless the app placed a SelectContent.
  const found = hasChild(children, SelectContent)
  const [placed, place] = usePlacedContent(!!options.items && !found)
  return (
    <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
      <OutletContext.Provider value={outlet}>
        <PlacedProvider value={place}>{children}</PlacedProvider>
        <PlacedProvider value={null}>
          {options.items && !placed && !found && <SelectContent />}
        </PlacedProvider>
        <SelectLayer handle={handle} outlet={outlet} />
      </OutletContext.Provider>
    </HandleScope>
  )
}

// A hidden React Native Modal renders nothing, so a closed modal select keeps
// its prepared content in place, hidden, where its items tell their labels.
function SelectLayer({
  handle,
  outlet,
}: {
  handle: PrimitiveHandle<SelectPrimitive>
  outlet: Outlet
}) {
  const { content } = React.useSyncExternalStore(outlet.subscribe, outlet.get)
  const parked = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => !handle.state.mounted && handle.state.modal !== false
  )
  return (
    <>
      {parked && content}
      <PopupLayer handle={handle} outlet={outlet} pressOutside />
    </>
  )
}

/**
 * A visible label for the select, a `Text` that names the trigger. Pressing
 * it moves the screen reader's focus to the trigger.
 * @experimental
 */
const SelectLabel: SelectParts["Label"] = parts.Label

type TriggerPartProps = Omit<
  PartProps<typeof Pressable, SelectTriggerState>,
  Clashing
> &
  SelectTriggerProps

/**
 * The button that opens the list: a `Pressable` with the combobox role and
 * its expanded state, named by the label, whose value is the selected
 * item's label. Without children, it shows a `SelectValue`.
 * @experimental
 */
function SelectTrigger({ controller, ...props }: TriggerPartProps) {
  const handle = useControllerTarget(
    controller as never,
    useNearest(select)
  ) as PrimitiveHandle<SelectPrimitive> | undefined
  if (!handle) {
    const { disabled, render, children, ...rest } = props
    return renderElement(
      Pressable,
      {
        accessibilityRole: "combobox",
        accessibilityState: { disabled: !!disabled },
        disabled,
        ...rest,
        children,
      },
      render as never,
      {
        open: false,
        disabled: !!disabled,
        readOnly: false,
        required: false,
        placeholder: true,
      }
    )
  }
  const part = <TriggerPart {...props} />
  return controller ? (
    <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
      {part}
    </HandleScope>
  ) : (
    part
  )
}

function TriggerPart({
  disabled,
  children = <SelectValue />,
  ...props
}: Omit<TriggerPartProps, "controller">) {
  const handle = useHandle(select)
  const user = useFieldControl(props as Record<string, unknown>, () =>
    handle.api.focus()
  )
  const labels = React.useSyncExternalStore(handle.instance.subscribe, () =>
    handle.api.internal.selection.labels()
  )
  const placeholder = handle.state.placeholder
  const named = !!(
    user["aria-label"] ||
    user["aria-labelledby"] ||
    handle.state.labeled
  )
  // Android rewrites the description only from a value with text, so an
  // empty one is sent as "".
  const value = labels.length ? labels.join(", ") : (placeholder ?? "")
  return usePressedPart(
    select,
    "trigger",
    {
      disabled,
      named: !!user["aria-labelledby"] || !!props["aria-label"],
    },
    mergeProps(
      {
        onTouchStart: landIn(handle.api),
        accessibilityValue: named ? { text: value } : undefined,
      },
      { ...user, children }
    ),
    Pressable,
    (part) => () => pressSelectTrigger(part, pressSource())
  )
}

const unselected: SelectValueState = {
  value: null,
  label: "",
  labels: [],
  placeholder: true,
}

/**
 * The selected item's label, or the placeholder, in a `Text`. Renders it for
 * you when it has no children.
 * @experimental
 */
function SelectValue({
  placeholder,
  maxLabels,
  getMoreLabel,
  render,
  children,
  ...props
}: Omit<PartProps<typeof Text, SelectValueState>, Clashing> &
  SelectValueProps) {
  // A trigger outside its select renders before the select it names has mounted.
  if (!useNearest(select)) {
    return renderElement(
      Text,
      { ...props, children: children ?? placeholder ?? null },
      render as never,
      unselected
    )
  }
  return (
    <ValuePart
      part={{ placeholder, maxLabels, getMoreLabel }}
      render={render}
      props={props}
    >
      {children}
    </ValuePart>
  )
}

function ValuePart({
  part,
  render,
  props,
  children,
}: {
  part: SelectValueProps
  render?: PartProps<typeof Text, SelectValueState>["render"]
  props: Record<string, any>
  children?: PartProps<typeof Text, SelectValueState>["children"]
}) {
  const handle = useHandle(select)
  const content = (state: SelectValueState, interaction: never) =>
    typeof children === "function"
      ? children(state, interaction)
      : (children ??
        (state.placeholder
          ? (part.placeholder ?? handle.state.placeholder ?? null)
          : state.label))
  return usePart(
    handle,
    "value",
    part,
    { ...props, children: content, render },
    Text
  )
}

type ContentPartProps = PartProps<
  typeof View,
  SelectContentState & PresenceState & SelectPlacementState
> &
  Omit<SelectContentProps, "container" | "anchor" | "alignItemWithTrigger"> & {
    /** Places the list against this instead of its trigger: a view, like a ref's `current`, or a point in window coordinates. */
    anchor?: NativeAnchor | null
  } & ExitProps

/**
 * The popup that holds the items, a `View` placed against the trigger, with
 * the placement in its state. VoiceOver's escape gesture on it closes the
 * list with the `"escape-key"` reason. Pass `onExit` to keep it on screen
 * while it animates out.
 * @experimental
 */
function SelectContent(props: ContentPartProps) {
  usePlaceContent()
  return useOutlet("content", <PlacedContent {...props} />)
}

// Rendered where the content renders, so it measures in that host.
function PlacedContent({
  side,
  align = "start",
  sideOffset,
  alignOffset,
  collisionPadding,
  arrowPadding,
  anchor,
  keepMounted,
  children,
  ...props
}: ContentPartProps) {
  const handle = useHandle(select)
  const mounted = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.mounted
  )
  const placement = usePlacement(
    handle.api as never,
    useHost(),
    props.style,
    mounted
  )
  const placed = usePlaced(placement)
  const body = (
    state: SelectContentState & PresenceState & SelectPlacementState,
    interaction: never
  ) =>
    typeof children === "function"
      ? children(state, interaction)
      : (children ??
        (state.items && handle.state.items && (
          <SelectItems items={state.items} />
        )))
  return usePart(
    select,
    "content",
    {
      side,
      align,
      sideOffset,
      alignOffset,
      collisionPadding,
      arrowPadding,
      anchor: anchor as never,
      keepMounted,
    },
    mergeProps(
      {
        ref: placement.content,
        style: {
          position: "absolute",
          top: placed?.y,
          opacity: placed ? undefined : 0,
          ...(placed && fromLeft(placed.x)),
        },
        // The Modal's host isolates it, popups beside it included.
        accessibilityViewIsModal: false,
        onAccessibilityEscape: () => layerInput()?.escape(handle.api),
        onTouchStart: landIn(handle.api),
      },
      {
        ...props,
        ...withState<SelectContentState & PresenceState, SelectPlacementState>(
          { ...props, children: body },
          () => ({ ...placed?.state })
        ),
      }
    ),
    View
  )
}

/**
 * The listbox, a `View`, when the content holds more than items, like a
 * `SelectInput`. Without children, it renders the select's `items` that match.
 * @experimental
 */
function SelectList({
  children = listItems,
  ...props
}: PartProps<typeof View, SelectContentState>) {
  return usePart(
    select,
    "list",
    {},
    { ...props, children } as Record<string, unknown>,
    View
  )
}

const listItems = (state: SelectContentState) => (
  <SelectItems items={state.items} />
)

/**
 * A search field inside `SelectContent`, a `TextInput` that filters the list
 * while focus stays in it. The highlighted item is announced as it changes.
 * Put the items in a `SelectList`. Name it with `aria-label`.
 * @experimental
 */
function SelectInput(
  props: PartProps<typeof TextInput, { open: boolean; disabled: boolean }>
) {
  const handle = useHandle(select)
  const query = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.query
  )
  return usePart(
    handle,
    "input",
    {},
    mergeProps(
      {
        value: query,
        onChangeText: (text: string) =>
          handle.api.setQuery(text, { reason: "input-change" }),
        onFocus: () => handle.api.internal.store.set({ focusInList: false }),
      },
      props
    ),
    TextInput
  )
}

/**
 * Shown while no item matches the search, a `View`. Its message is announced
 * when it appears.
 * @experimental
 */
function SelectEmpty({
  children,
  ...props
}: PartProps<typeof View, SelectEmptyState>) {
  const content = (state: SelectEmptyState, interaction: never) =>
    typeof children === "function"
      ? children(state, interaction)
      : state.empty
        ? children
        : null
  return usePart(
    select,
    "empty",
    {},
    { ...props, children: content } as Record<string, unknown>,
    View
  )
}

/**
 * A polite live region for loading and result counts, a `View`. Its content
 * is yours, usually a function of its state.
 * @experimental
 */
const SelectStatus: SelectParts["Status"] = parts.Status

type ItemPartProps<T> = Omit<
  PartProps<typeof Pressable, SelectItemState>,
  Clashing
> &
  SelectItemProps<T> & { keywords?: string[] }

/**
 * An option: a `Pressable`, its own accessible element, selected while its
 * value is the select's value. Pressing it selects it, or toggles it with
 * `multiple`. Its label is its text, or `label`.
 * @experimental
 */
function SelectItem<T = string>({
  value,
  label,
  disabled,
  index,
  keywords,
  children,
  ...props
}: ItemPartProps<T>) {
  const handle = useHandle(select)
  const key = handle.api.internal.keyOf(value)
  const group = useAround(select, "group")?.id as string | undefined
  return usePart(
    select,
    "item",
    {
      id: key,
      value,
      label: itemLabel(label, children),
      disabled,
      index,
      group,
      ...(keywords && { keywords }),
    } as never,
    mergeProps(
      {
        // Keyboard focus in the list says the option itself, so the
        // highlight it moves isn't announced too.
        onFocus: () => {
          handle.api.internal.store.set({ focusInList: true })
          handle.api.internal.listbox.highlight(key, { focus: false })
        },
      },
      { ...props, children }
    ),
    Pressable
  )
}

/**
 * The item's text, a `Text`. Its state holds the text in segments, marking
 * what the search matched. Without string content, it shows the item's label.
 * @experimental
 */
function SelectItemText({
  children,
  ...props
}: PartProps<typeof Text, SelectItemTextState>) {
  const item = useAround(select, "item")
  if (!item) {
    throw new Error("<SelectItemText> must be used inside <SelectItem>.")
  }
  const label = (item.label as string | undefined) ?? (item.value as string)
  const text = typeof children === "string" ? children : (label ?? "")
  const content =
    typeof children === "function"
      ? children
      : (state: SelectItemTextState) =>
          state.segments.map((segment) => segment.text).join("")
  return usePart(
    select,
    "item-text",
    { id: item.value as string, text },
    { ...props, children: content } as Record<string, unknown>,
    Text
  )
}

/**
 * An option that selects every item that matches, with `multiple`: in its
 * group inside a `SelectGroup`, or in the whole list. A `Pressable`, checked
 * or mixed.
 * @experimental
 */
function SelectSelectAll(
  props: PartProps<typeof Pressable, SelectSelectAllState>
) {
  const handle = useHandle(select)
  handle.instance.use(selectSelectAll)
  const part = {
    id: selectAllKey(useAround(select, "group")?.id as string | undefined),
  }
  return usePart(
    handle,
    "select-all" as never,
    part as never,
    props as Record<string, unknown>,
    Pressable
  )
}

/**
 * The check inside a selected item, a `View`. Rendered while it's selected,
 * or always with `keepMounted`. Hidden from screen readers.
 * @experimental
 */
const SelectItemIndicator = notLabel(
  parts.ItemIndicator
) as SelectParts["ItemIndicator"]

const iconNodes = new WeakMap<object, React.ReactNode>()

/**
 * An icon inside an item, a `View`. `SelectValueIcon` shows the selected
 * item's in the trigger. Screen readers skip it, and `mirror` flips it when
 * the app runs right to left.
 * @experimental
 */
const SelectItemIcon = notLabel(function SelectItemIcon({
  mirror,
  children,
  ...props
}: PartProps<typeof View, SelectItemIconState> & SelectItemIconProps) {
  const handle = useHandle(select)
  handle.instance.use(selectItemIcons)
  const part = {
    id: React.useId(),
    mirror,
    item: useAround(select, "item")?.value as string | undefined,
  }
  const instancePart = handle.instance.part("item-icon" as never, part as never)
  iconNodes.set(instancePart, children as React.ReactNode)
  return usePart(
    handle,
    "item-icon" as never,
    part as never,
    { ...props, children } as never,
    View
  )
})

/**
 * The selected item's icon, a copy of its `SelectItemIcon`'s children in a
 * `View`, like before the value in the trigger. Rendered while one item is
 * selected and it has an icon.
 * @experimental
 */
function SelectValueIcon(props: Omit<PartProps<typeof View>, "children">) {
  return useNearest(select) ? <ValueIconPart {...props} /> : null
}

function ValueIconPart(props: Omit<PartProps<typeof View>, "children">) {
  const handle = useHandle(select)
  handle.instance.use(selectItemIcons)
  React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.icons
  )
  const keys = handle.api.internal.selection.keys()
  const icon =
    keys.length === 1 ? handle.api.internal.icons.get(keys[0]) : undefined
  return usePart(
    handle,
    "value-icon" as never,
    {} as never,
    { ...props, children: icon && iconNodes.get(icon) } as never,
    View
  )
}

/**
 * A group of items, a `View`, named by its `SelectGroupLabel`, and hidden
 * while none of its items shows.
 * @experimental
 */
const SelectGroup: SelectParts["Group"] = parts.Group

/**
 * The group's heading, a `Text`, which names the group.
 * @experimental
 */
const SelectGroupLabel: SelectParts["GroupLabel"] = parts.GroupLabel

/**
 * A line between items or groups, a `View` hidden from screen readers.
 * @experimental
 */
const SelectSeparator: SelectParts["Separator"] = parts.Separator

/**
 * A `Pressable` that selects nothing. Shown while something is selected, or
 * always with `keepMounted`.
 * @experimental
 */
const SelectClear: SelectParts["Clear"] = parts.Clear

/**
 * A `View` on the list's edge that points at the trigger. Hidden from screen
 * readers.
 * @experimental
 */
function SelectArrow(
  props: PartProps<typeof View, SelectArrowState & SelectArrowPlacementState>
) {
  const handle = useHandle(select)
  const placement = placementOf(handle.api as never)
  const arrow = usePlaced(placement)?.arrow
  const vertical = arrow?.side === "top" || arrow?.side === "bottom"
  return usePart(
    select,
    "arrow",
    {},
    mergeProps(
      {
        ref: placement.arrow,
        style: {
          position: "absolute",
          ...(arrow &&
            (vertical ? fromLeft(arrow.offset) : { top: arrow.offset })),
        },
      },
      {
        ...props,
        ...withState<SelectArrowState, SelectArrowPlacementState>(
          props,
          () => ({
            side: arrow?.side,
            align: arrow?.align,
            arrowClamped: arrow?.arrowClamped,
          })
        ),
      }
    ),
    View
  )
}

/**
 * Renders data items. Used by data selects, and available for custom layouts.
 * @experimental
 */
function SelectItems({ items }: { items: ListData<unknown> }) {
  const handle = useHandle(select)
  return renderItems(items, handle.api.internal.keyOf)
}

// Keyed by each item's key, and each group by its label, so a filtered list
// keeps its options.
// check-code: allow return-type recursive, so TypeScript cannot infer it.
function renderItems(
  items: readonly ListData<any>[number][],
  keyOf: (value: unknown) => string
): React.ReactNode {
  return items.map((entry, index) => {
    if (typeof entry === "string") {
      return (
        <SelectItem key={entry} value={entry}>
          <Text>{entry}</Text>
        </SelectItem>
      )
    }
    if ("type" in entry && entry.type === "separator") {
      return <SelectSeparator key={`separator-${index}`} />
    }
    if ("type" in entry && entry.type === "group") {
      return (
        <SelectGroup key={`group-${entry.label ?? index}`}>
          {entry.label && <SelectGroupLabel>{entry.label}</SelectGroupLabel>}
          {renderItems(entry.items, keyOf)}
        </SelectGroup>
      )
    }
    const { value, label, disabled, keywords } = entry as {
      value: unknown
      label: string
      disabled?: boolean
      keywords?: string[]
    }
    return (
      <SelectItem
        key={keyOf(value)}
        value={value}
        label={label}
        disabled={disabled}
        {...(keywords && { keywords })}
      >
        <Text>{label}</Text>
      </SelectItem>
    )
  })
}

export { createSelectController } from "@ui-sdk/core/select"
// Core's `SelectValue` type ends in `Data` here, since the component has its name.
export type {
  ListAnnouncement,
  ListData,
  ListFilter,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  MatchSegment,
  SelectApi,
  SelectArrowState,
  SelectChangeOptions,
  SelectClearProps,
  SelectClearState,
  SelectContentProps,
  SelectContentState,
  SelectController,
  SelectDismissReason,
  SelectEmptyState,
  SelectInputState,
  SelectItemIconProps,
  SelectItemIconState,
  SelectItemIndicatorProps,
  SelectItemIndicatorState,
  SelectItemProps,
  SelectItemState,
  SelectItemTextState,
  SelectOpenChangeReason,
  SelectOptions,
  SelectPrimitive,
  SelectQueryChangeReason,
  SelectSelectAllState,
  SelectStatusState,
  SelectTriggerProps,
  SelectTriggerState,
  SelectValue as SelectValueData,
  SelectValueChangeReason,
  SelectValueProps,
  SelectValueState,
} from "@ui-sdk/core/select"

export {
  type NativeAnchor,
  Select,
  SelectArrow,
  type SelectArrowPlacementState,
  SelectClear,
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectGroupLabel,
  SelectInput,
  SelectItem,
  SelectItemIcon,
  SelectItemIndicator,
  SelectItems,
  SelectItemText,
  SelectLabel,
  SelectList,
  type SelectPlacementState,
  type SelectProps,
  SelectSelectAll,
  SelectSeparator,
  SelectStatus,
  SelectTrigger,
  SelectValue,
  SelectValueIcon,
}

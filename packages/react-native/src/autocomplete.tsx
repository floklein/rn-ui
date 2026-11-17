import {
  autocompleteNative,
  pressAutocompleteTrigger,
  submitAutocomplete,
  typeAutocomplete,
} from "@ui-sdk/core/native"
import {
  autocomplete,
  type AutocompleteArrowState,
  type AutocompleteContentProps,
  type AutocompleteContentState,
  type AutocompleteEmptyState,
  type AutocompleteInputState,
  type AutocompleteItemProps,
  type AutocompleteItemState,
  type AutocompleteItemTextState,
  type AutocompleteOptions,
  type AutocompletePrimitive,
  type AutocompleteTriggerState,
  type ListData,
} from "@ui-sdk/core/autocomplete"
import { type PresenceState, withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  type AccessibilityActionEvent,
  Pressable,
  Text,
  TextInput,
  type TextInputSelectionChangeEvent,
  View,
} from "react-native"
import {
  hasChild,
  itemLabel,
  notLabel,
  Placed as PlacedProvider,
  usePlaceContent,
  usePlacedContent,
} from "./children"
import { useControllerEntry } from "./controller-target"
import { useFieldControl, useInheritedDisabled } from "./field-context"
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
  OutletContext,
  PopupLayer,
  useOutlet,
} from "./popup-parts"
import { mergeProps, withState } from "./render-element"
import {
  createParts,
  type ExitProps,
  HandleScope,
  type PartProps,
  type Parts,
  type PrimitiveHandle,
  useAround,
  useHandle,
  usePart,
  usePressedPart,
  usePrimitive,
} from "./use-primitive"

type AutocompleteParts = Parts<
  AutocompletePrimitive,
  {
    label: typeof Text
    clear: typeof Pressable
    "item-icon": typeof View
    group: typeof View
    "group-label": typeof Text
    separator: typeof View
    status: typeof View
  }
>

const parts: AutocompleteParts = createParts(
  autocomplete,
  {
    label: Text,
    clear: Pressable,
    "item-icon": View,
    group: View,
    "group-label": Text,
    separator: View,
    status: View,
  },
  autocompleteNative
)

/**
 * The fields placement adds to the content's state, as the web's CSS
 * variables and data attributes. Undefined until it's first placed.
 * @experimental
 */
type AutocompletePlacementState = {
  /** The side it opened on, after flipping. */
  side?: "top" | "right" | "bottom" | "left"
  /** How it lines up with the field. */
  align?: "start" | "center" | "end"
  /** The width of the field, or of the anchor it's placed against. */
  anchorWidth?: number
  /** The height of the field, or of the anchor it's placed against. */
  anchorHeight?: number
  /** The width it has before reaching the edge of the space it may use. */
  availableWidth?: number
  /** The height it has before reaching the edge of the space it may use, for a list that scrolls past it. */
  availableHeight?: number
  /** The point facing the field, as a `transformOrigin` style, like `"0px 0px"`. */
  transformOrigin?: string
  /** Where the field's center falls along the edge facing it, kept clear of the corners. */
  arrowOffset?: number
}

/**
 * The fields placement adds to the arrow's state.
 * @experimental
 */
type AutocompleteArrowPlacementState = {
  /** The side the list opened on. */
  side?: "top" | "right" | "bottom" | "left"
  /** How the list lines up with the field. */
  align?: "start" | "center" | "end"
  /** Whether the arrow stopped short of the field's center at a corner. */
  arrowClamped?: boolean
}

type Clashing = "value" | "defaultValue" | "onChange" | "onSelect" | "onSubmit"

/**
 * The props of `Autocomplete`.
 * @experimental
 */
type AutocompleteProps = AutocompleteOptions & {
  /** The suggestions render in the app's `OverlayHost`, so focus and the keyboard stay in the field. */
  modal?: never
  container?: never
  name?: never
  form?: never
  required?: never
  children?: React.ReactNode
}

/**
 * A text field that suggests as you type. The text is the value. Renders no
 * view of its own; its suggestions render in the app's `OverlayHost`.
 * @experimental
 */
function Autocomplete({ children, ...options }: AutocompleteProps) {
  const disabled = useInheritedDisabled()
  const handle = usePrimitive(
    autocomplete,
    { ...options, disabled: options.disabled || disabled },
    autocompleteNative
  )
  useControllerEntry(options.controller, handle)
  const [outlet] = React.useState(createOutlet)
  const found = hasChild(children, AutocompleteContent)
  const [placed, place] = usePlacedContent(!!options.items && !found)
  return (
    <HandleScope handle={handle as unknown as PrimitiveHandle<never>}>
      <OutletContext.Provider value={outlet}>
        <PlacedProvider value={place}>{children}</PlacedProvider>
        <PlacedProvider value={null}>
          {options.items && !placed && !found && <AutocompleteContent />}
        </PlacedProvider>
        <PopupLayer handle={handle} outlet={outlet} modal={false} />
      </OutletContext.Provider>
    </HandleScope>
  )
}

// Placement reads the popup's internals, which Autocomplete's api keeps under
// `popupCore`; one object per autocomplete, since placement is kept by api.
const popupApis = new WeakMap<object, { internal: unknown }>()
function popupApiOf(api: PrimitiveHandle<AutocompletePrimitive>["api"]) {
  let popupApi = popupApis.get(api)
  if (!popupApi) {
    popupApis.set(api, (popupApi = { internal: api.internal.popupCore }))
  }
  return popupApi as never
}

const anchors = ["input"]

/**
 * A visible label for the field, a `Text` that names it. Pressing it starts
 * editing the field.
 * @experimental
 */
const AutocompleteLabel: AutocompleteParts["Label"] = parts.Label

type Selection = { start: number; end: number }

/**
 * The text field, a `TextInput` with the combobox role. Typing filters the
 * suggestions and opens them, the highlighted one is announced, and the
 * return key chooses it, or submits the text through `onSubmit`.
 * @experimental
 */
function AutocompleteInput(
  props: Omit<
    PartProps<typeof TextInput, AutocompleteInputState>,
    "value" | "defaultValue" | "children" | "readOnly" | "editable"
  > & { disabled?: never }
) {
  const handle = useHandle(autocomplete)
  const { value, disabled, readOnly, formDisabled } =
    React.useSyncExternalStore(handle.instance.subscribe, () => handle.state)
  const editable = !disabled && !formDisabled && !readOnly
  // Set only until the caret next moves, so it never fights the keyboard.
  const [selection, setSelection] = React.useState<Selection>()
  const caret = React.useRef<Selection | undefined>(undefined)
  const user = useFieldControl(props as Record<string, unknown>, () =>
    handle.api.focus()
  )
  return usePart(
    handle,
    "input",
    {},
    mergeProps(
      {
        value,
        selection,
        editable,
        autoCorrect: false,
        autoCapitalize: "none",
        submitBehavior: "submit",
        accessibilityState: { disabled: !editable },
        onTouchStart: landIn(handle.api),
        onChangeText(text: string) {
          const atEnd = (caret.current?.end ?? value.length) >= value.length
          setSelection(typeAutocomplete(handle.api, text, atEnd))
        },
        onSelectionChange(event: TextInputSelectionChangeEvent) {
          caret.current = event.nativeEvent.selection
          setSelection(undefined)
        },
        onSubmitEditing: () => submitAutocomplete(handle.api),
        onAccessibilityAction(event: AccessibilityActionEvent) {
          const { actionName } = event.nativeEvent
          withSource("virtual", () => {
            if (actionName === "expand") {
              handle.api.internal.show({
                by: "keyboard",
                reason: "trigger-press",
              })
            } else if (actionName === "collapse") {
              handle.api.internal.hide({ reason: "trigger-press" })
            }
          })
        },
        onFocus() {
          handle.api.internal.store.set({ focusInList: false })
          if (handle.api.internal.options().openOnFocus && !handle.state.open) {
            handle.api.internal.show({
              by: "keyboard",
              reason: "trigger-focus",
            })
          }
        },
      },
      user
    ),
    TextInput
  )
}

/**
 * A `Pressable` that opens and closes the suggestions. A screen reader's press
 * moves its focus to the first suggestion. Name it with `aria-label`.
 * @experimental
 */
function AutocompleteTrigger(
  props: PartProps<typeof Pressable, AutocompleteTriggerState>
) {
  const handle = useHandle(autocomplete)
  return usePressedPart(
    handle,
    "trigger",
    {},
    mergeProps({ onTouchStart: landIn(handle.api) }, props),
    Pressable,
    (part) => () => pressAutocompleteTrigger(part, pressSource())
  )
}

/**
 * A `Pressable` that empties the field, shown while there's text to clear.
 * Name it with `aria-label`.
 * @experimental
 */
const AutocompleteClear: AutocompleteParts["Clear"] = parts.Clear

type ContentPartProps = PartProps<
  typeof View,
  AutocompleteContentState & PresenceState & AutocompletePlacementState
> &
  Omit<AutocompleteContentProps, "container" | "anchor"> & {
    /** Places the list against this instead of the field: a view, like a ref's `current`, or a point in window coordinates. */
    anchor?: NativeAnchor | null
  } & ExitProps

/**
 * The popup that holds the suggestions, a `View` placed against the field in
 * the app's `OverlayHost`, with the placement in its state. VoiceOver's
 * escape gesture on it closes the list with the `"escape-key"` reason. Pass
 * `onExit` to keep it on screen while it animates out.
 * @experimental
 */
function AutocompleteContent(props: ContentPartProps) {
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
  const handle = useHandle(autocomplete)
  const mounted = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.state.mounted
  )
  const placement = usePlacement(
    popupApiOf(handle.api),
    useHost(),
    props.style,
    mounted,
    anchors
  )
  const placed = usePlaced(placement)
  const body = (
    state: AutocompleteContentState &
      PresenceState &
      AutocompletePlacementState,
    interaction: never
  ) =>
    typeof children === "function"
      ? children(state, interaction)
      : (children ??
        (state.items && handle.state.items && <AutocompleteList />))
  return usePart(
    autocomplete,
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
        onAccessibilityEscape: () => layerInput()?.escape(handle.api),
        onTouchStart: landIn(handle.api),
      },
      {
        ...props,
        ...withState<
          AutocompleteContentState & PresenceState,
          AutocompletePlacementState
        >({ ...props, children: body }, () => ({ ...placed?.state })),
      }
    ),
    View
  )
}

/**
 * The listbox, a `View`. Without children, it renders the autocomplete's
 * `items` that match.
 * @experimental
 */
function AutocompleteList({
  children = listItems,
  ...props
}: PartProps<typeof View, AutocompleteContentState>) {
  return usePart(
    autocomplete,
    "list",
    {},
    { ...props, children } as Record<string, unknown>,
    View
  )
}

const listItems = (state: AutocompleteContentState) => (
  <AutocompleteItems items={state.items} />
)

/**
 * A suggestion: a `Pressable`, its own accessible element. Pressing it fills
 * the field in with its label and closes the list. Its label is its text, or
 * `label`.
 * @experimental
 */
function AutocompleteItem({
  value,
  label,
  keywords,
  disabled,
  index,
  children,
  ...props
}: Omit<PartProps<typeof Pressable, AutocompleteItemState>, Clashing> &
  AutocompleteItemProps) {
  const handle = useHandle(autocomplete)
  const group = useAround(autocomplete, "group")?.id as string | undefined
  return usePart(
    handle,
    "item",
    {
      id: value,
      value,
      label: itemLabel(label, children) ?? value,
      disabled,
      index,
      group,
      ...(keywords && { keywords }),
    } as never,
    mergeProps(
      {
        // Keyboard focus in the list says the suggestion itself, so the
        // highlight it moves isn't announced too.
        onFocus: () => {
          handle.api.internal.store.set({ focusInList: true })
          handle.api.internal.listbox.highlight(value, { focus: false })
        },
      },
      { ...props, children }
    ),
    Pressable
  )
}

/**
 * The suggestion's text, a `Text`. Its state holds the text in segments,
 * marking what the field's text matched. Without string content, it shows
 * the suggestion's label.
 * @experimental
 */
function AutocompleteItemText({
  children,
  ...props
}: PartProps<typeof Text, AutocompleteItemTextState>) {
  const item = useAround(autocomplete, "item")
  if (!item) {
    throw new Error(
      "<AutocompleteItemText> must be used inside <AutocompleteItem>."
    )
  }
  const label = (item.label ?? item.value) as string
  const text = typeof children === "string" ? children : label
  const content =
    typeof children === "function"
      ? children
      : (state: AutocompleteItemTextState) =>
          state.segments.map((segment) => segment.text).join("")
  return usePart(
    autocomplete,
    "item-text",
    { id: item.value as string, text },
    { ...props, children: content } as Record<string, unknown>,
    Text
  )
}

/**
 * An icon inside a suggestion, a `View`. Screen readers and filtering skip
 * it, and `mirror` flips it when the app runs right to left.
 * @experimental
 */
const AutocompleteItemIcon = notLabel(
  parts.ItemIcon
) as AutocompleteParts["ItemIcon"]

/**
 * A group of suggestions, a `View`, named by its `AutocompleteGroupLabel`,
 * and hidden while none of its suggestions shows.
 * @experimental
 */
const AutocompleteGroup: AutocompleteParts["Group"] = parts.Group

/**
 * The group's heading, a `Text`, which names the group.
 * @experimental
 */
const AutocompleteGroupLabel: AutocompleteParts["GroupLabel"] = parts.GroupLabel

/**
 * A line between suggestions or groups, a `View` hidden from screen readers.
 * @experimental
 */
const AutocompleteSeparator: AutocompleteParts["Separator"] = parts.Separator

/**
 * Shown while no suggestion matches, a `View`. Its message is announced when
 * it appears.
 * @experimental
 */
function AutocompleteEmpty({
  children,
  ...props
}: PartProps<typeof View, AutocompleteEmptyState>) {
  const content = (state: AutocompleteEmptyState, interaction: never) =>
    typeof children === "function"
      ? children(state, interaction)
      : state.empty
        ? children
        : null
  return usePart(
    autocomplete,
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
const AutocompleteStatus: AutocompleteParts["Status"] = parts.Status

/**
 * A `View` on the list's edge that points at the field. Hidden from screen
 * readers.
 * @experimental
 */
function AutocompleteArrow(
  props: PartProps<
    typeof View,
    AutocompleteArrowState & AutocompleteArrowPlacementState
  >
) {
  const handle = useHandle(autocomplete)
  const placement = placementOf(popupApiOf(handle.api))
  const arrow = usePlaced(placement)?.arrow
  const vertical = arrow?.side === "top" || arrow?.side === "bottom"
  return usePart(
    autocomplete,
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
        ...withState<AutocompleteArrowState, AutocompleteArrowPlacementState>(
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
 * Renders data suggestions. Used by data autocompletes, and available for
 * custom layouts.
 * @experimental
 */
function AutocompleteItems({ items }: { items: ListData<string> }) {
  return renderItems(items)
}

// Keyed by each suggestion, and each group by its label, so a filtered list
// keeps its suggestions.
// check-code: allow return-type recursive, so TypeScript cannot infer it.
function renderItems(
  items: readonly ListData<string>[number][]
): React.ReactNode {
  return items.map((entry, index) => {
    if (typeof entry === "string") {
      return (
        <AutocompleteItem key={entry} value={entry}>
          <Text>{entry}</Text>
        </AutocompleteItem>
      )
    }
    if ("type" in entry && entry.type === "separator") {
      return <AutocompleteSeparator key={`separator-${index}`} />
    }
    if ("type" in entry && entry.type === "group") {
      return (
        <AutocompleteGroup key={`group-${entry.label ?? index}`}>
          {entry.label && (
            <AutocompleteGroupLabel>{entry.label}</AutocompleteGroupLabel>
          )}
          {renderItems(entry.items)}
        </AutocompleteGroup>
      )
    }
    const { value, label, disabled, keywords } = entry as {
      value: string
      label: string
      disabled?: boolean
      keywords?: string[]
    }
    return (
      <AutocompleteItem
        key={value}
        value={value}
        label={label}
        disabled={disabled}
        {...(keywords && { keywords })}
      >
        <Text>{label}</Text>
      </AutocompleteItem>
    )
  })
}

export { createAutocompleteController } from "@ui-sdk/core/autocomplete"
export type {
  AutocompleteApi,
  AutocompleteArrowState,
  AutocompleteChangeOptions,
  AutocompleteClearProps,
  AutocompleteClearState,
  AutocompleteContentProps,
  AutocompleteContentState,
  AutocompleteController,
  AutocompleteDismissReason,
  AutocompleteEmptyState,
  AutocompleteInputState,
  AutocompleteItemIconProps,
  AutocompleteItemIconState,
  AutocompleteItemProps,
  AutocompleteItemState,
  AutocompleteItemTextState,
  AutocompleteOpenChangeReason,
  AutocompleteOptions,
  AutocompletePrimitive,
  AutocompleteStatusState,
  AutocompleteSubmitDetails,
  AutocompleteTriggerState,
  AutocompleteValueChangeReason,
  ListAnnouncement,
  ListData,
  ListFilter,
  ListGroup,
  ListHighlightDetails,
  ListItem,
  ListSeparator,
  MatchSegment,
  SearchFilter,
} from "@ui-sdk/core/autocomplete"

export {
  Autocomplete,
  AutocompleteArrow,
  type AutocompleteArrowPlacementState,
  AutocompleteClear,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteItemIcon,
  AutocompleteItems,
  AutocompleteItemText,
  AutocompleteLabel,
  AutocompleteList,
  type AutocompletePlacementState,
  type AutocompleteProps,
  AutocompleteSeparator,
  AutocompleteStatus,
  AutocompleteTrigger,
  type NativeAnchor,
}

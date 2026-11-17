import type {
  dateInput,
  DateInputSegmentData,
  DateInputSegmentState,
  DateInputSegmentType,
  DateInputState,
} from "@ui-sdk/core/date-input"
import { withSource } from "@ui-sdk/core/renderer"
import * as React from "react"
import {
  type GestureResponderEvent,
  Text,
  TextInput,
  type TextInputKeyPressEvent,
  type TextInputSelectionChangeEvent,
  View,
} from "react-native"
import { carry } from "./carried-context"
import { useFieldControl } from "./field-context"
import { type Interaction, mergeProps, renderElement } from "./render-element"
import {
  type PartProps,
  type PrimitiveHandle,
  useHandle,
  usePart,
} from "./use-primitive"

type RootProps = Omit<PartProps<typeof View, DateInputState>, "defaultValue">

type SegmentProps = Omit<
  PartProps<typeof TextInput, DateInputSegmentState>,
  "value" | "defaultValue" | "editable" | "selection" | "readOnly" | "children"
> & {
  /** The segment it shows, from the root's `segments`. */
  segment: DateInputSegmentData
  /** The text between segments, which it shows unless it has children. Segments you type in take none. */
  children?: PartProps<typeof Text, DateInputSegmentState>["children"]
}

// Time Input's primitive has the same slots and state.
type Segmented = typeof dateInput
type EditableType = Exclude<DateInputSegmentType, "literal">

// What names the input as a whole, which each segment says after its own name.
const NamesContext = carry(
  "SegmentedInput",
  React.createContext<{ describedBy?: string; hint?: string }>({})
)

function useSegmentedRoot(
  handle: PrimitiveHandle<Segmented>,
  { children, ...props }: RootProps,
  Segment: (props: SegmentProps) => React.ReactNode
) {
  const { disabled, formDisabled, readOnly } = handle.state
  const editable = !disabled && !formDisabled && !readOnly
  const named = useFieldControl(props as Record<string, unknown>, () => {
    if (!disabled && !formDisabled) {
      handle.api.focus()
    }
  })
  const ids = [named["aria-labelledby"], named["aria-describedby"]]
    .filter(Boolean)
    .join(" ")
  const ariaLabel = named["aria-label"] as string | undefined
  const names = React.useMemo(
    () => ({
      describedBy: ids || undefined,
      hint: ids ? undefined : ariaLabel,
    }),
    [ids, ariaLabel]
  )
  const content =
    children === undefined
      ? (state: DateInputState) =>
          state.segments.map((segment) => (
            <Segment key={segment.key} segment={segment} />
          ))
      : children
  const part = usePart(
    handle,
    "root",
    {},
    mergeProps(named, {
      children: content,
      // A press around the segments, or on the text between them, starts
      // editing the nearest one.
      onStartShouldSetResponder: () => editable,
      onResponderRelease: (event: GestureResponderEvent) =>
        handle.api.internal
          .nearestSegment({
            clientX: event.nativeEvent.pageX,
            target: null,
          } as unknown as MouseEvent)
          ?.focus(),
    }) as Record<string, unknown>,
    View
  )
  return <NamesContext value={names}>{part}</NamesContext>
}

function useSegment(
  primitive: Segmented,
  { segment, render, children, ...props }: SegmentProps
) {
  const handle = useHandle(primitive)
  const names = React.useContext(NamesContext)
  const own = { segment, id: segment.key }
  // Slot state leaves out the selection a refused edit writes back.
  const selection = React.useSyncExternalStore(
    handle.instance.subscribe,
    () => handle.instance.get().selection
  )
  if (!segment.editable) {
    return usePart(
      handle,
      "segment",
      own,
      {
        ...(props as Record<string, unknown>),
        render,
        children: children ?? segment.text,
      },
      Text
    )
  }
  const type = segment.type as EditableType
  const { internal } = handle.api
  const { disabled, formDisabled, readOnly } = handle.state
  const editable = !disabled && !formDisabled && !readOnly
  return usePart(
    handle,
    "segment",
    own,
    mergeProps(
      {
        placeholder: type === "year" ? "––––" : "––",
        "aria-describedby": names.describedBy,
        accessibilityHint: names.hint,
      },
      props,
      {
        selection:
          selection?.type === type
            ? { start: selection.start, end: selection.end }
            : undefined,
        editable,
        onChangeText: (text: string) =>
          withSource("keyboard", () => internal.typeText(type, text)),
        onKeyPress: ({ nativeEvent }: TextInputKeyPressEvent) =>
          withSource("keyboard", () =>
            internal.pressKey(type, nativeEvent.key)
          ),
        onSelectionChange: ({ nativeEvent }: TextInputSelectionChangeEvent) =>
          internal.selectText(type, nativeEvent.selection),
        onBlur: () => withSource("keyboard", () => internal.leaveText(type)),
        onSubmitEditing: () => withSource("keyboard", internal.blur),
        // Screen readers adjust a segment as the arrow keys step it.
        accessibilityActions: editable
          ? [{ name: "increment" }, { name: "decrement" }]
          : undefined,
        // Android enables a read-only TextInput, which then takes typing,
        // when its disabled state is false.
        accessibilityState: {
          disabled: !editable,
          ...props.accessibilityState,
        },
        render: (
          given: Record<string, unknown>,
          state: DateInputSegmentState,
          interaction: Interaction
        ) =>
          renderElement(
            TextInput,
            { ...given, value: state.text },
            render,
            state,
            interaction
          ),
      }
    ),
    TextInput
  )
}

export {
  type RootProps,
  type Segmented,
  type SegmentProps,
  useSegment,
  useSegmentedRoot,
}

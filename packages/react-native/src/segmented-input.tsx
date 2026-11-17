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
  Platform,
  Text,
  TextInput,
  type TextInputKeyPressEvent,
  type TextInputSelectionChangeEvent,
  View,
} from "react-native"
import { carry } from "./carried-context"
import { useFieldControl } from "./field-context"
import { idsOf, resolveIds, useReferences } from "./names"
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

// A container's name reaches no screen reader, so each segment says the
// group's before its own, and takes the group's description as its hint.
const NamesContext = carry(
  "SegmentedInput",
  React.createContext<{
    labelledBy?: string
    label?: string
    describedBy?: string
  }>({})
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
  const labelledBy = named["aria-labelledby"] as string | undefined
  const label = named["aria-label"] as string | undefined
  const describedBy = named["aria-describedby"] as string | undefined
  const names = React.useMemo(
    () => ({ labelledBy, label, describedBy }),
    [labelledBy, label, describedBy]
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
  const { labelledBy, label, describedBy } = React.useContext(NamesContext)
  useReferences(idsOf(labelledBy))
  const group = resolveIds(idsOf(labelledBy)) ?? label
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
        "aria-label": group ? `${group}, ${segment.label}` : undefined,
        "aria-describedby": describedBy,
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
        // An iOS TextInput's accessibility element is its UITextField, which
        // VoiceOver's adjust never reaches.
        accessibilityActions:
          editable && Platform.OS === "android"
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

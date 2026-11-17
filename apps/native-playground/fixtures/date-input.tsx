import {
  createDateInputController,
  DateInput,
  type DateInputOptions,
  DateInputSegment,
  type DateInputState,
} from "@ui-sdk/react-native/date-input"
import {
  TimeInput,
  TimeInputSegment,
  type TimeInputState,
} from "@ui-sdk/react-native/time-input"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<DateInputOptions["onValueChange"]>

const dateSegments =
  (name: string) =>
  ({ segments }: DateInputState) =>
    segments.map((segment) => (
      <DateInputSegment
        key={segment.key}
        segment={segment}
        testID={segment.editable ? `${name}-${segment.type}` : undefined}
        style={segment.editable ? styles.segment : styles.literal}
      />
    ))

const timeSegments = ({ segments }: TimeInputState) =>
  segments.map((segment) => (
    <TimeInputSegment
      key={segment.key}
      segment={segment}
      testID={segment.editable ? `time-${segment.type}` : undefined}
      style={segment.editable ? styles.segment : styles.literal}
    />
  ))

function Fixture() {
  const [start] = useState(createDateInputController)
  const [changes, setChanges] = useState<string[]>([])
  const changed: Change = (value, details) =>
    setChanges((current) => [
      ...current,
      `value:${value}:${details.reason}:${details.source}`,
    ])

  return (
    <View style={styles.fixture}>
      <Text testID="changes">{changes.slice(-3).join(" ") || "none"}</Text>
      <DateInput
        aria-label="Start date"
        locale="en-US"
        controller={start}
        onValueChange={changed}
        style={styles.root}
      >
        {dateSegments("start")}
      </DateInput>
      <TimeInput
        aria-label="Meeting time"
        locale="en-US"
        hourCycle={12}
        onValueChange={changed}
        style={styles.root}
      >
        {timeSegments}
      </TimeInput>
      <DateInput
        aria-label="Locked date"
        locale="en-US"
        defaultValue="2026-11-04"
        disabled
        style={styles.root}
      >
        {dateSegments("locked")}
      </DateInput>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="focus-start"
          onPress={() => start.focus()}
          style={styles.action}
        >
          <Text>Focus start</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="set-start"
          onPress={() => start.setValue("2026-12-25")}
          style={styles.action}
        >
          <Text>Set Christmas</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 12 },
  root: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    height: 44,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  segment: {
    alignSelf: "stretch",
    minWidth: 44,
    fontSize: 16,
    textAlign: "center",
    color: "#18181b",
  },
  literal: { fontSize: 16, color: "#71717a" },
  actions: { flexDirection: "row", gap: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }

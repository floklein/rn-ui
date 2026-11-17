import { Button } from "@ui-sdk/react-native/button"
import {
  createTimelineController,
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
  type TimelineStatus,
} from "@ui-sdk/react-native/timeline"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"

const steps: {
  value: string
  title: string
  time: string
  description: string
  status: TimelineStatus
}[] = [
  {
    value: "placed",
    title: "Order placed",
    time: "Nov 1",
    description: "We received your order.",
    status: "complete",
  },
  {
    value: "packed",
    title: "Packed",
    time: "Nov 2",
    description: "Your items left the shelf.",
    status: "complete",
  },
  {
    value: "shipped",
    title: "Shipped",
    time: "Nov 3",
    description: "On its way with the carrier.",
    status: "current",
  },
  {
    value: "delivered",
    title: "Delivered",
    time: "Nov 5",
    description: "Expected by Thursday.",
    status: "upcoming",
  },
]

function Example() {
  const [controller] = React.useState(createTimelineController)
  return (
    <View style={styles.stack}>
      <Button
        onPress={() => controller.focus("shipped")}
        style={(_state, { pressed }) => [
          styles.control,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.controlLabel}>Go to Current Step</Text>
      </Button>
      <Timeline aria-label="Order status" controller={controller}>
        {steps.map((step) => (
          <TimelineItem
            key={step.value}
            value={step.value}
            status={step.status}
            accessible
            style={({ last }) => [styles.item, last && styles.lastItem]}
          >
            <TimelineMarker
              style={({ status }) => [
                styles.marker,
                status === "complete" && styles.complete,
                status === "current" && styles.current,
              ]}
            >
              {step.status === "complete" && (
                <Text style={styles.check}>✓</Text>
              )}
            </TimelineMarker>
            <TimelineConnector
              style={({ last }) => [styles.connector, last && styles.hidden]}
            />
            <TimelineTitle
              style={({ status }) => [
                styles.title,
                status === "upcoming" && styles.upcoming,
              ]}
            >
              {step.title}
            </TimelineTitle>
            <TimelineTime style={styles.time}>{step.time}</TimelineTime>
            <TimelineDescription style={styles.description}>
              {step.description}
            </TimelineDescription>
          </TimelineItem>
        ))}
      </Timeline>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, width: 320, maxWidth: "100%" },
  control: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 8,
  },
  pressed: { backgroundColor: "#f4f4f5" },
  controlLabel: { fontSize: 15, color: "#18181b" },
  item: { paddingLeft: 32, paddingBottom: 24, gap: 2 },
  lastItem: { paddingBottom: 0 },
  marker: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  complete: { borderColor: "#18181b", backgroundColor: "#18181b" },
  current: { borderColor: "#18181b", borderWidth: 4 },
  check: { fontSize: 9, fontWeight: "700", color: "#ffffff" },
  connector: {
    position: "absolute",
    left: 7,
    top: 22,
    bottom: 4,
    width: 2,
    backgroundColor: "#e4e4e7",
  },
  hidden: { display: "none" },
  title: { fontSize: 15, fontWeight: "500", color: "#18181b" },
  upcoming: { color: "#71717a" },
  time: { fontSize: 13, color: "#71717a" },
  description: { fontSize: 14, color: "#3f3f46" },
})

export { Example }

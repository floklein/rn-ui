import { Button } from "@ui-sdk/react-native/button"
import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react-native/timeline"
import * as React from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const updates = [
  {
    id: 1,
    author: "Ada",
    time: "Nov 10",
    text: "Shipped the new onboarding flow.",
  },
  {
    id: 2,
    author: "Grace",
    time: "Nov 10",
    text: "Fixed the flaky upload test.",
  },
  {
    id: 3,
    author: "Linus",
    time: "Nov 9",
    text: "Moved the docs to the new theme.",
  },
  {
    id: 4,
    author: "Margaret",
    time: "Nov 9",
    text: "Wrote the launch checklist.",
  },
  { id: 5, author: "Ada", time: "Nov 8", text: "Cut search latency in half." },
  {
    id: 6,
    author: "Grace",
    time: "Nov 7",
    text: "Added keyboard shortcuts to the editor.",
  },
  {
    id: 7,
    author: "Linus",
    time: "Nov 6",
    text: "Cleaned up the old billing code.",
  },
  {
    id: 8,
    author: "Margaret",
    time: "Nov 5",
    text: "Ran the accessibility review.",
  },
  { id: 9, author: "Ada", time: "Nov 4", text: "Started the mobile layout." },
]

const pageSize = 3

function Example() {
  const log = useLog()
  const [count, setCount] = React.useState(pageSize)
  const [busy, setBusy] = React.useState(false)

  function loadMore() {
    setBusy(true)
    setTimeout(() => {
      setCount((count) => count + pageSize)
      setBusy(false)
      log(`Loaded ${pageSize} more updates`)
    }, 600)
  }

  return (
    <View style={styles.stack}>
      <Button
        disabled={busy || count >= updates.length}
        onPress={loadMore}
        style={(state, { pressed }) => [
          styles.control,
          pressed && styles.pressed,
          state.disabled && styles.disabled,
        ]}
      >
        <Text style={styles.controlLabel}>
          {busy ? "Loading…" : "Load More"}
        </Text>
      </Button>
      <Timeline
        feed
        busy={busy}
        aria-label="Team updates"
        style={({ busy }) => busy && styles.busy}
      >
        {updates.slice(0, count).map((update) => (
          <TimelineItem
            key={update.id}
            accessible
            style={({ last }) => [styles.item, last && styles.lastItem]}
          >
            <TimelineMarker style={styles.marker} />
            <TimelineConnector
              style={({ last }) => [styles.connector, last && styles.hidden]}
            />
            <TimelineTitle style={styles.title}>{update.author}</TimelineTitle>
            <TimelineTime style={styles.time}>{update.time}</TimelineTime>
            <TimelineDescription style={styles.description}>
              {update.text}
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
  disabled: { opacity: 0.5 },
  controlLabel: { fontSize: 15, color: "#18181b" },
  busy: { opacity: 0.6 },
  item: { paddingLeft: 32, paddingBottom: 24, gap: 2 },
  lastItem: { paddingBottom: 0 },
  marker: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: "#18181b",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
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
  time: { fontSize: 13, color: "#71717a" },
  description: { fontSize: 14, color: "#3f3f46" },
})

export { Example }

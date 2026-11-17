import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react-native/timeline"
import { StyleSheet } from "react-native"

const events = [
  {
    title: "Deployed to production",
    time: "Today, 2:32 PM",
    description: "Version 2.4.1 is live in every region.",
  },
  {
    title: "Checks passed",
    time: "Today, 2:20 PM",
    description: "312 tests and the bundle size budget.",
  },
  {
    title: "Pull request merged",
    time: "Today, 1:58 PM",
    description: "Ada merged Cache search results into main.",
  },
  {
    title: "Review requested",
    time: "Yesterday, 5:05 PM",
    description: "Grace and Linus were asked to review.",
  },
]

function Example() {
  return (
    <Timeline aria-label="Activity" style={styles.timeline}>
      {events.map((event) => (
        <TimelineItem
          key={event.title}
          accessible
          style={({ last }) => [styles.item, last && styles.lastItem]}
        >
          <TimelineMarker style={styles.marker} />
          <TimelineConnector
            style={({ last }) => [styles.connector, last && styles.hidden]}
          />
          <TimelineTitle style={styles.title}>{event.title}</TimelineTitle>
          <TimelineTime style={styles.time}>{event.time}</TimelineTime>
          <TimelineDescription style={styles.description}>
            {event.description}
          </TimelineDescription>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

const styles = StyleSheet.create({
  timeline: { width: 320, maxWidth: "100%" },
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

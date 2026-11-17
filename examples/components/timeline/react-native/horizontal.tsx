import {
  Timeline,
  TimelineConnector,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react-native/timeline"
import { StyleSheet } from "react-native"

const milestones = [
  { title: "Kickoff", time: "January" },
  { title: "Design review", time: "March" },
  { title: "Beta", time: "June" },
  { title: "Launch", time: "September" },
]

function Example() {
  return (
    <Timeline
      orientation="horizontal"
      loop={false}
      aria-label="Roadmap"
      style={styles.timeline}
    >
      {milestones.map((milestone) => (
        <TimelineItem key={milestone.title} accessible style={styles.item}>
          <TimelineMarker style={styles.marker} />
          <TimelineConnector
            style={({ last }) => [styles.connector, last && styles.hidden]}
          />
          <TimelineTitle style={styles.title}>{milestone.title}</TimelineTitle>
          <TimelineTime style={styles.time}>{milestone.time}</TimelineTime>
        </TimelineItem>
      ))}
    </Timeline>
  )
}

const styles = StyleSheet.create({
  timeline: { flexDirection: "row" },
  item: { width: 96, paddingTop: 28, paddingRight: 12, gap: 2 },
  marker: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: "#18181b",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  connector: {
    position: "absolute",
    top: 7,
    left: 20,
    right: 4,
    height: 2,
    backgroundColor: "#e4e4e7",
  },
  hidden: { display: "none" },
  title: { fontSize: 14, fontWeight: "500", color: "#18181b" },
  time: { fontSize: 13, color: "#71717a" },
})

export { Example }

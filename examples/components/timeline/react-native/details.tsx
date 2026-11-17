import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react-native/collapsible"
import {
  Timeline,
  TimelineConnector,
  TimelineDescription,
  TimelineItem,
  TimelineMarker,
  TimelineTime,
  TimelineTitle,
} from "@ui-sdk/react-native/timeline"
import { StyleSheet, Text } from "react-native"

const releases = [
  {
    title: "Version 2.4",
    time: "October 28",
    description: "Faster search and resumable uploads.",
    changes: [
      "Search now matches file contents, not only names.",
      "Uploads resume after the connection drops.",
    ],
  },
  {
    title: "Version 2.3",
    time: "September 30",
    description: "Shared links and a new sidebar.",
    changes: [
      "Shared links remember the folder they were opened from.",
      "The sidebar collapses to icons on narrow screens.",
    ],
  },
  {
    title: "Version 2.2",
    time: "August 26",
    description: "Dark mode follows your system.",
    changes: ["Dark mode follows the system setting.", "Avatars are sharper."],
  },
]

function Example() {
  return (
    <Timeline aria-label="Changelog" style={styles.timeline}>
      {releases.map((release) => (
        <TimelineItem
          key={release.title}
          style={({ last }) => [styles.item, last && styles.lastItem]}
        >
          <TimelineMarker style={styles.marker} />
          <TimelineConnector
            style={({ last }) => [styles.connector, last && styles.hidden]}
          />
          <TimelineTitle style={styles.title}>{release.title}</TimelineTitle>
          <TimelineTime style={styles.time}>{release.time}</TimelineTime>
          <TimelineDescription style={styles.description}>
            {release.description}
          </TimelineDescription>
          <Collapsible>
            <CollapsibleTrigger style={styles.trigger}>
              {({ open }) => (
                <Text style={styles.triggerLabel}>
                  What Changed {open ? "▴" : "▾"}
                </Text>
              )}
            </CollapsibleTrigger>
            <CollapsiblePanel style={styles.panel}>
              {release.changes.map((change) => (
                <Text key={change} style={styles.change}>
                  • {change}
                </Text>
              ))}
            </CollapsiblePanel>
          </Collapsible>
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
  trigger: { alignSelf: "flex-start", paddingVertical: 6 },
  triggerLabel: { fontSize: 14, fontWeight: "500", color: "#18181b" },
  panel: { gap: 4 },
  change: { fontSize: 14, color: "#3f3f46" },
})

export { Example }

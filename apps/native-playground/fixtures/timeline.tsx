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
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const events = Array.from({ length: 10 }, (_, index) => ({
  value: `event-${index + 1}`,
  title: `Event ${index + 1}`,
  time: `Nov ${index + 1}`,
}))

function Fixture() {
  const [scrolled, setScrolled] = useState(0)
  return (
    <View style={styles.fixture}>
      <Text testID="timeline-readout">
        {`Scrolled ${Math.round(scrolled)}`}
      </Text>
      <ScrollView
        testID="timeline-scroll"
        style={styles.scroll}
        onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <Timeline
          aria-label="Activity"
          testID="timeline"
          style={styles.timeline}
        >
          {events.map((event) => (
            <TimelineItem
              key={event.value}
              value={event.value}
              accessible={
                event.value === "event-2" || event.value === "event-3"
              }
              testID={event.value}
              style={styles.item}
            >
              {(state) => (
                <>
                  <TimelineMarker style={styles.marker} />
                  <TimelineConnector
                    style={[styles.connector, state.last && styles.hidden]}
                  />
                  <TimelineTitle>{event.title}</TimelineTitle>
                  <TimelineTime>{event.time}</TimelineTime>
                  <TimelineDescription testID={`${event.value}-place`}>
                    {`Place ${state.index}${state.first ? ", first" : ""}${state.last ? ", last" : ""}`}
                  </TimelineDescription>
                </>
              )}
            </TimelineItem>
          ))}
          <TimelineItem
            value="release"
            status="current"
            testID="release"
            style={styles.item}
          >
            <TimelineMarker style={styles.marker} />
            <TimelineTitle>Release</TimelineTitle>
            <TimelineDescription testID="release-place">
              {(state) => `Status ${state.status}`}
            </TimelineDescription>
            <Collapsible>
              <CollapsibleTrigger
                testID="release-trigger"
                style={styles.trigger}
              >
                <Text>What Changed</Text>
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <Text testID="release-notes">Faster search.</Text>
              </CollapsiblePanel>
            </Collapsible>
          </TimelineItem>
        </Timeline>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  scroll: { height: 320, borderWidth: 1, borderColor: "#d4d4d8" },
  timeline: { padding: 12 },
  item: { minHeight: 64, paddingLeft: 28, paddingBottom: 12 },
  marker: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#18181b",
  },
  connector: {
    position: "absolute",
    left: 6,
    top: 18,
    bottom: 0,
    width: 2,
    backgroundColor: "#d4d4d8",
  },
  hidden: { display: "none" },
  trigger: { minHeight: 44, justifyContent: "center" },
})

export { Fixture }

import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/react-native/progress"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Fixture() {
  const [value, setValue] = useState<number | null>(40)
  return (
    <View style={styles.fixture}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          testID="step"
          onPress={() => setValue(Math.min((value ?? 0) + 30, 100))}
          style={styles.action}
        >
          <Text>Step</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="unknown"
          onPress={() => setValue(null)}
          style={styles.action}
        >
          <Text>Unknown</Text>
        </Pressable>
      </View>
      <Progress value={value} testID="progress" style={styles.bar}>
        <ProgressLabel testID="progress-label">Uploading photos</ProgressLabel>
        <ProgressValue testID="progress-value" />
        <ProgressTrack testID="track" style={styles.track}>
          <ProgressIndicator testID="indicator" style={styles.indicator} />
        </ProgressTrack>
      </Progress>
      <Progress
        value={null}
        aria-label="Connecting"
        testID="connecting"
        style={styles.bar}
      >
        <ProgressTrack style={styles.track}>
          <ProgressIndicator style={[styles.indicator, styles.unknown]} />
        </ProgressTrack>
      </Progress>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 16 },
  row: { flexDirection: "row", gap: 8 },
  action: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
  },
  bar: { flexDirection: "row", flexWrap: "wrap", gap: 8, minHeight: 44 },
  track: {
    flexDirection: "row",
    width: 200,
    height: 10,
    backgroundColor: "#e4e4e7",
  },
  indicator: { height: "100%", backgroundColor: "#18181b" },
  unknown: { width: "40%", opacity: 0.4 },
})

export { Fixture }

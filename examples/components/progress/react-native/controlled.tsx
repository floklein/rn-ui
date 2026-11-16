import { Button } from "@ui-sdk/react-native/button"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "@ui-sdk/react-native/progress"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const total = 5

function Example() {
  const log = useLog()
  const [uploaded, setUploaded] = useState(1)

  function uploadNext() {
    if (uploaded >= total) {
      return
    }
    setUploaded(uploaded + 1)
    log(`Uploaded ${uploaded + 1} of ${total} photos`)
  }

  function reset() {
    setUploaded(0)
    log("Reset to 0 photos")
  }

  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Button
          aria-disabled={uploaded >= total}
          onPress={uploadNext}
          style={styles.button}
        >
          <Text>Upload Next</Text>
        </Button>
        <Button onPress={reset} style={styles.button}>
          <Text>Reset</Text>
        </Button>
      </View>
      <Progress value={(uploaded / total) * 100} style={styles.progress}>
        <ProgressLabel style={styles.label}>Uploading photos</ProgressLabel>
        <ProgressValue style={styles.value} />
        <ProgressTrack style={styles.track}>
          <ProgressIndicator style={styles.indicator} />
        </ProgressTrack>
      </Progress>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  progress: {
    flexDirection: "row",
    minHeight: 44,
    flexWrap: "wrap",
    alignItems: "center",
    rowGap: 8,
    columnGap: 12,
    width: 320,
    maxWidth: "100%",
  },
  label: { fontSize: 15, fontWeight: "500" },
  value: {
    marginStart: "auto",
    color: "#71717a",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  track: {
    flexDirection: "row",
    width: "100%",
    height: 10,
    padding: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
  },
  indicator: { height: "100%", borderRadius: 999, backgroundColor: "#18181b" },
})

export { Example }

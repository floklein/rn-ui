import { Label } from "@ui-sdk/react-native/label"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react-native/slider"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <Slider id="volume" defaultValue={75} style={styles.slider}>
      <View style={styles.row}>
        <Label htmlFor="volume" style={styles.label}>
          Volume
        </Label>
        <SliderValue style={styles.value} />
      </View>
      <SliderControl style={styles.control}>
        <SliderTrack style={styles.track}>
          <SliderIndicator style={styles.indicator} />
          <SliderThumb style={styles.thumb} />
        </SliderTrack>
      </SliderControl>
    </Slider>
  )
}

const styles = StyleSheet.create({
  slider: { width: 320, maxWidth: "100%", gap: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  label: { fontSize: 15, fontWeight: "500" },
  value: { color: "#71717a", fontSize: 13, fontVariant: ["tabular-nums"] },
  control: { height: 44, justifyContent: "center" },
  track: { height: 2, borderRadius: 999, backgroundColor: "#d4d4d8" },
  indicator: { borderRadius: 999, backgroundColor: "#18181b" },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#18181b",
    backgroundColor: "#ffffff",
  },
})

export { Example }

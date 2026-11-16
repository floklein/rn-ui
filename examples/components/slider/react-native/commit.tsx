import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  type SliderThumbState,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react-native/slider"
import { StyleSheet, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()

  return (
    <Field>
      <Slider
        defaultValue={50}
        onValueCommit={(value, details) =>
          log(`Saved ${value} (${details.reason})`)
        }
        style={styles.slider}
      >
        <View style={styles.row}>
          <FieldLabel style={styles.label}>Brightness</FieldLabel>
          <SliderValue style={styles.value} />
        </View>
        <SliderControl style={styles.control}>
          <SliderTrack style={styles.track}>
            <SliderIndicator style={styles.indicator} />
            <SliderThumb style={thumbStyle} />
          </SliderTrack>
        </SliderControl>
      </Slider>
    </Field>
  )
}

const thumbStyle = (state: SliderThumbState) => [
  styles.thumb,
  state.dragging && styles.dragging,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  slider: { width: 320, maxWidth: "100%", gap: 4 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  label: { fontSize: 15 },
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
  dragging: { backgroundColor: "#f4f4f5" },
  disabled: { borderColor: "#d4d4d8" },
})

export { Example }

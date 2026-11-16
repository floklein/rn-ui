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

const time = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`

function Example() {
  return (
    <Field>
      <Slider
        defaultValue={[540, 1020]}
        min={0}
        max={1440}
        step={15}
        minStepsBetweenThumbs={16}
        format={time}
        style={styles.slider}
      >
        <View style={styles.row}>
          <FieldLabel style={styles.label}>Opening hours</FieldLabel>
          <SliderValue style={styles.value} />
        </View>
        <SliderControl style={styles.control}>
          <SliderTrack style={styles.track}>
            <SliderIndicator style={styles.indicator} />
            <SliderThumb index={0} aria-label="Opens" style={thumbStyle} />
            <SliderThumb index={1} aria-label="Closes" style={thumbStyle} />
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

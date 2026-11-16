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

function Ticks({ count }: { count: number }) {
  return (
    <View style={styles.ticks}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.tick} />
      ))}
    </View>
  )
}

function Example() {
  return (
    <View style={styles.stack}>
      <Field>
        <Slider
          defaultValue={2010}
          min={1990}
          max={2030}
          step={5}
          format={{ useGrouping: false }}
          style={styles.slider}
        >
          <View style={styles.row}>
            <FieldLabel style={styles.label}>Year</FieldLabel>
            <SliderValue style={styles.value} />
          </View>
          <SliderControl style={styles.control}>
            <SliderTrack style={styles.track}>
              <SliderIndicator style={styles.indicator} />
              <SliderThumb style={thumbStyle} />
            </SliderTrack>
          </SliderControl>
          <Ticks count={9} />
        </Slider>
      </Field>
      <Field>
        <Slider
          defaultValue={0.5}
          min={0}
          max={1}
          step={0.05}
          style={styles.slider}
        >
          <View style={styles.row}>
            <FieldLabel style={styles.label}>Opacity</FieldLabel>
            <SliderValue style={styles.value} />
          </View>
          <SliderControl style={styles.control}>
            <SliderTrack style={styles.track}>
              <SliderIndicator style={styles.indicator} />
              <SliderThumb style={thumbStyle} />
            </SliderTrack>
          </SliderControl>
          <Ticks count={21} />
        </Slider>
      </Field>
    </View>
  )
}

const thumbStyle = (state: SliderThumbState) => [
  styles.thumb,
  state.dragging && styles.dragging,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  stack: { gap: 16 },
  ticks: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 5,
    marginTop: -16,
  },
  tick: { width: 1, backgroundColor: "#d4d4d8" },
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

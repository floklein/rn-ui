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
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Field>
      <Slider defaultValue={60} style={styles.slider}>
        <View style={styles.row}>
          <FieldLabel style={styles.label}>Brightness</FieldLabel>
          <SliderValue style={styles.value}>
            {(state) => `${state.text}%`}
          </SliderValue>
        </View>
        <SliderControl style={styles.control}>
          <SliderTrack style={styles.track}>
            <SliderIndicator style={styles.indicator} />
            <SliderThumb
              style={thumbStyle}
              render={(props, state) => (
                <View
                  {...props}
                  style={[props.style, state.dragging && styles.lifted]}
                />
              )}
            >
              {(state) => <Text style={styles.bubble}>{state.thumbValue}</Text>}
            </SliderThumb>
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
  lifted: { transform: [{ scale: 1.2 }] },
  bubble: {
    position: "absolute",
    bottom: 26,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#f4f4f5",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
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

import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  type SliderThumbState,
  SliderTrack,
} from "@ui-sdk/react-native/slider"
import { StyleSheet, View } from "react-native"

const channels = [
  { label: "Bass", value: 50 },
  { label: "Treble", value: 25 },
]

function Example() {
  return (
    <View style={styles.channels}>
      {channels.map((channel) => (
        <Field key={channel.label} style={styles.channel}>
          <Slider
            orientation="vertical"
            defaultValue={channel.value}
            style={styles.vertical}
          >
            <SliderControl style={styles.verticalControl}>
              <SliderTrack style={styles.verticalTrack}>
                <SliderIndicator style={styles.indicator} />
                <SliderThumb style={thumbStyle} />
              </SliderTrack>
            </SliderControl>
          </Slider>
          <FieldLabel style={styles.label}>{channel.label}</FieldLabel>
        </Field>
      ))}
    </View>
  )
}

const thumbStyle = (state: SliderThumbState) => [
  styles.thumb,
  state.dragging && styles.dragging,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  channels: { flexDirection: "row", gap: 32 },
  channel: { alignItems: "center", gap: 8 },
  vertical: { height: 160 },
  verticalControl: { width: 44, alignItems: "center" },
  verticalTrack: {
    width: 2,
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#d4d4d8",
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

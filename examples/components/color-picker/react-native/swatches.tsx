import {
  ColorPicker,
  ColorPickerChannelInput,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
  type ColorPickerSwatchItemDrawnState,
} from "@ui-sdk/react-native/color-picker"
import { StyleSheet, View } from "react-native"

const presets = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
]

function Example() {
  return (
    <ColorPicker
      aria-label="Label color"
      space="srgb"
      format="hex"
      defaultValue="#0ea5e9"
      style={styles.picker}
    >
      <ColorPickerSwatches aria-label="Presets" style={styles.row}>
        {presets.map((preset) => (
          <ColorPickerSwatchItem
            key={preset}
            value={preset}
            style={presetStyle}
          />
        ))}
      </ColorPickerSwatches>
      <View style={styles.row}>
        <ColorPickerChannelInput channel="red" style={styles.input} />
        <ColorPickerChannelInput channel="green" style={styles.input} />
        <ColorPickerChannelInput channel="blue" style={styles.input} />
      </View>
    </ColorPicker>
  )
}

const presetStyle = (state: ColorPickerSwatchItemDrawnState) => [
  styles.preset,
  { backgroundColor: state.displayColor },
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  picker: { gap: 12 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  preset: { width: 44, height: 44, borderRadius: 22 },
  selected: { borderWidth: 3, borderColor: "#18181b" },
  input: {
    width: 72,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    fontSize: 15,
  },
})

export { Example }

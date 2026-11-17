import {
  formatColor,
  parseColor,
  type ColorFormat,
} from "@ui-sdk/react-native/color"
import {
  ColorPicker,
  ColorPickerArea,
  type ColorPickerAreaState,
  ColorPickerAreaThumb,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  type ColorPickerSliderTrackState,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
  type ColorPickerSwatchItemDrawnState,
  type ColorPickerSwatchState,
} from "@ui-sdk/react-native/color-picker"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const formats: { label: string; value: ColorFormat }[] = [
  { label: "Hex", value: "hex" },
  { label: "RGB", value: "srgb" },
  { label: "HSL", value: "hsl" },
  { label: "OKLCH", value: "oklch" },
]

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
  const [format, setFormat] = useState<ColorFormat>("hex")
  const [value, setValue] = useState("#0ea5e9")

  function changeFormat(next: ColorFormat | null) {
    if (next) {
      setFormat(next)
      setValue(formatColor(parseColor(value)!, next))
    }
  }

  return (
    <ColorPicker
      aria-label="Brand color"
      format={format}
      value={value}
      onValueChange={setValue}
      style={styles.picker}
    >
      <ColorPickerArea style={areaStyle}>
        <ColorPickerAreaThumb style={styles.thumb} />
      </ColorPickerArea>
      <View style={styles.row}>
        <View style={styles.sliders}>
          <ColorPickerSlider channel="hue" style={sliderStyle}>
            <ColorPickerSliderThumb style={styles.thumb} />
          </ColorPickerSlider>
          <ColorPickerSlider channel="alpha" style={sliderStyle}>
            <ColorPickerSliderThumb style={styles.thumb} />
          </ColorPickerSlider>
        </View>
        <ColorPickerSwatch style={swatchStyle} />
      </View>
      <SegmentedControl
        aria-label="Format"
        value={format}
        onValueChange={changeFormat}
        style={styles.formats}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        {formats.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            style={styles.format}
          >
            <Text style={styles.formatLabel}>{option.label}</Text>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <ColorPickerInput aria-label="Color" style={styles.input} />
      <ColorPickerSwatches aria-label="Presets" style={styles.row}>
        {presets.map((preset) => (
          <ColorPickerSwatchItem
            key={preset}
            value={preset}
            style={presetStyle}
          />
        ))}
      </ColorPickerSwatches>
    </ColorPicker>
  )
}

const areaStyle = (state: ColorPickerAreaState) => [
  styles.area,
  { backgroundImage: state.areaBackground },
]

const sliderStyle = (state: ColorPickerSliderTrackState) => [
  styles.slider,
  { backgroundImage: state.sliderBackground },
]

const swatchStyle = (state: ColorPickerSwatchState) => [
  styles.swatch,
  { backgroundColor: state.displayColor },
]

const presetStyle = (state: ColorPickerSwatchItemDrawnState) => [
  styles.preset,
  { backgroundColor: state.displayColor },
  state.selected && styles.selected,
]

const indicatorStyle = (state: SegmentedControlIndicatorState) => [
  styles.indicator,
  {
    left: state.indicatorLeft,
    top: state.indicatorTop,
    width: state.indicatorWidth,
    height: state.indicatorHeight,
  },
]

const styles = StyleSheet.create({
  picker: { width: 280, maxWidth: "100%", gap: 12 },
  area: { height: 180, borderRadius: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  sliders: { flex: 1, gap: 8 },
  slider: { height: 28, borderRadius: 14 },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  swatch: { width: 44, height: 44, borderRadius: 8 },
  formats: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  format: { paddingHorizontal: 12, paddingVertical: 6 },
  formatLabel: { fontSize: 14, fontWeight: "500" },
  indicator: {
    position: "absolute",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    fontSize: 15,
  },
  preset: { width: 28, height: 28, borderRadius: 14 },
  selected: { borderWidth: 3, borderColor: "#18181b" },
})

export { Example }

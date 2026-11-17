import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaCanvas,
  ColorPickerAreaThumb,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  type ColorPickerSliderTrackState,
  ColorPickerSwatch,
  type ColorPickerSwatchState,
} from "@ui-sdk/react-native/color-picker"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <ColorPicker
      aria-label="Accent"
      space="oklch"
      defaultValue="oklch(0.62 0.19 259)"
      style={styles.picker}
    >
      <ColorPickerArea style={styles.area}>
        <ColorPickerAreaCanvas />
        <ColorPickerAreaThumb style={styles.thumb} />
      </ColorPickerArea>
      <ColorPickerSlider channel="hue" style={sliderStyle}>
        <ColorPickerSliderThumb style={styles.thumb} />
      </ColorPickerSlider>
      <ColorPickerSlider channel="alpha" style={sliderStyle}>
        <ColorPickerSliderThumb style={styles.thumb} />
      </ColorPickerSlider>
      <View style={styles.row}>
        <ColorPickerSwatch style={swatchStyle} />
        <ColorPickerInput
          aria-label="OKLCH"
          style={[styles.input, styles.grow]}
        />
      </View>
    </ColorPicker>
  )
}

const sliderStyle = (state: ColorPickerSliderTrackState) => [
  styles.slider,
  { backgroundImage: state.sliderBackground },
]

const swatchStyle = (state: ColorPickerSwatchState) => [
  styles.swatch,
  { backgroundColor: state.displayColor },
]

const styles = StyleSheet.create({
  picker: { width: 280, maxWidth: "100%", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  grow: { flex: 1 },
  swatch: { width: 44, height: 44, borderRadius: 8 },
  area: { height: 180, borderRadius: 8 },
  slider: { height: 28, borderRadius: 14 },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  input: {
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    fontSize: 15,
  },
})

export { Example }

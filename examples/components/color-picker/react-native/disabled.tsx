import {
  ColorPicker,
  ColorPickerArea,
  type ColorPickerAreaState,
  ColorPickerAreaThumb,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  type ColorPickerSliderTrackState,
} from "@ui-sdk/react-native/color-picker"
import { StyleSheet } from "react-native"

function Example() {
  return (
    <ColorPicker
      aria-label="Brand color"
      defaultValue="#0ea5e9"
      disabled
      style={styles.picker}
    >
      <ColorPickerArea style={areaStyle}>
        <ColorPickerAreaThumb style={styles.thumb} />
      </ColorPickerArea>
      <ColorPickerSlider channel="hue" style={sliderStyle}>
        <ColorPickerSliderThumb style={styles.thumb} />
      </ColorPickerSlider>
      <ColorPickerInput aria-label="Hex" style={styles.input} />
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

const styles = StyleSheet.create({
  picker: { width: 280, maxWidth: "100%", gap: 12, opacity: 0.5 },
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

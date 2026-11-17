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
  type ColorPickerSwatchState,
} from "@ui-sdk/react-native/color-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { StyleSheet } from "react-native"

function Example() {
  return (
    <ColorPicker aria-label="Background" defaultValue="#22c55e">
      <Popover>
        <PopoverTrigger aria-label="Background" style={styles.trigger}>
          <ColorPickerSwatch style={swatchStyle} />
        </PopoverTrigger>
        <PopoverContent style={styles.content}>
          <ColorPickerArea style={areaStyle}>
            <ColorPickerAreaThumb style={styles.thumb} />
          </ColorPickerArea>
          <ColorPickerSlider channel="hue" style={sliderStyle}>
            <ColorPickerSliderThumb style={styles.thumb} />
          </ColorPickerSlider>
          <ColorPickerInput aria-label="Hex" style={styles.input} />
        </PopoverContent>
      </Popover>
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

const styles = StyleSheet.create({
  trigger: { alignSelf: "flex-start", borderRadius: 8 },
  swatch: { width: 44, height: 44, borderRadius: 8 },
  content: {
    width: 260,
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
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

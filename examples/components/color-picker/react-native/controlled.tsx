import {
  ColorPicker,
  ColorPickerArea,
  type ColorPickerAreaState,
  ColorPickerAreaThumb,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  type ColorPickerSliderTrackState,
  createColorPickerController,
} from "@ui-sdk/react-native/color-picker"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [picker] = useState(() => createColorPickerController())
  const [value, setValue] = useState("#0ea5e9")

  return (
    <View style={styles.stack}>
      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          onPress={() => picker.setValue("#663399")}
          style={styles.button}
        >
          <Text>Use Purple</Text>
        </Pressable>
      </View>
      <ColorPicker
        aria-label="Theme color"
        value={value}
        onValueChange={(next) => setValue(next)}
        onValueCommit={(next, details) =>
          log(`committed: ${next} (${details.reason})`)
        }
        controller={picker}
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
    </View>
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
  stack: { gap: 16 },
  controls: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  picker: { width: 280, maxWidth: "100%", gap: 12 },
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

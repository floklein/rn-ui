import {
  ColorPicker,
  ColorPickerArea,
  type ColorPickerAreaState,
  ColorPickerAreaThumb,
  ColorPickerChannelInput,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  type ColorPickerSliderTrackState,
  ColorPickerSwatch,
  type ColorPickerSwatchState,
  ColorPickerSwatches,
  ColorPickerSwatchItem,
  type ColorPickerSwatchItemDrawnState,
} from "@ui-sdk/react-native/color-picker"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

function Thumb() {
  return <View style={styles.dot} />
}

function Fixture() {
  const [value, setValue] = useState("#0ea5e9")
  const [saved, setSaved] = useState("nothing saved")
  const [hue, setHue] = useState("#ff0000")
  const [hueKept, setHueKept] = useState("#ff0000")
  const [scrolled, setScrolled] = useState(0)
  const [area, setArea] = useState("#808080")
  const [areaKept, setAreaKept] = useState("#808080")
  const [lifted, setLifted] = useState(0)
  const [sliding, setSliding] = useState(false)
  const [picking, setPicking] = useState(false)
  return (
    <View style={styles.fixture}>
      <Text testID="readout">{`Value ${value}, ${saved}`}</Text>
      <Text testID="scroll-readout">
        {`Hue ${hue} kept ${hueKept}, scrolled ${scrolled}; area ${area} kept ${areaKept}, lifted ${lifted}`}
      </Text>
      <ColorPicker
        aria-label="Brand"
        value={value}
        onValueChange={setValue}
        onValueCommit={(next, details) =>
          setSaved(`saved ${next} by ${details.reason}`)
        }
        style={styles.picker}
      >
        <ColorPickerArea testID="area" style={areaStyle}>
          <ColorPickerAreaThumb style={styles.thumb}>
            <Thumb />
          </ColorPickerAreaThumb>
        </ColorPickerArea>
        <ColorPickerSlider testID="hue" channel="hue" style={sliderStyle}>
          <ColorPickerSliderThumb style={styles.thumb}>
            <Thumb />
          </ColorPickerSliderThumb>
        </ColorPickerSlider>
        <View style={styles.row}>
          <ColorPickerSwatch testID="swatch" style={swatchStyle} />
          <ColorPickerInput
            testID="input"
            aria-label="Hex"
            style={styles.input}
          />
          <ColorPickerChannelInput
            testID="alpha-input"
            channel="alpha"
            style={styles.input}
          />
        </View>
        <ColorPickerSwatches style={styles.row}>
          <ColorPickerSwatchItem value="#ef4444" style={presetStyle} />
          <ColorPickerSwatchItem value="#22c55e" style={presetStyle} />
        </ColorPickerSwatches>
      </ColorPicker>
      <ScrollView
        horizontal
        scrollEnabled={!sliding}
        testID="sideways"
        onScroll={(event) =>
          setScrolled(Math.round(event.nativeEvent.contentOffset.x))
        }
        scrollEventThrottle={16}
        style={styles.sideways}
      >
        <View style={styles.wide}>
          <ColorPicker
            defaultValue="#ff0000"
            onValueChange={setHue}
            onValueCommit={setHueKept}
          >
            <ColorPickerSlider
              testID="sideways-hue"
              channel="hue"
              {...dragging(setSliding)}
              style={sliderStyle}
            >
              <ColorPickerSliderThumb
                aria-label="Sideways hue"
                style={styles.thumb}
              >
                <Thumb />
              </ColorPickerSliderThumb>
            </ColorPickerSlider>
          </ColorPicker>
        </View>
      </ScrollView>
      <ScrollView
        scrollEnabled={!picking}
        testID="upright"
        onScroll={(event) =>
          setLifted(Math.round(event.nativeEvent.contentOffset.y))
        }
        scrollEventThrottle={16}
        style={styles.upright}
      >
        <View style={styles.tall}>
          <ColorPicker
            defaultValue="#808080"
            onValueChange={setArea}
            onValueCommit={setAreaKept}
          >
            <ColorPickerArea
              testID="upright-area"
              {...dragging(setPicking)}
              style={areaStyle}
            >
              <ColorPickerAreaThumb
                aria-label="Upright color"
                style={styles.thumb}
              >
                <Thumb />
              </ColorPickerAreaThumb>
            </ColorPickerArea>
          </ColorPicker>
        </View>
      </ScrollView>
    </View>
  )
}

const dragging = (set: (dragging: boolean) => void) => ({
  onResponderGrant: () => set(true),
  onResponderRelease: () => set(false),
  onResponderTerminate: () => set(false),
})

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
  styles.swatch,
  { backgroundColor: state.displayColor },
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  picker: { width: 240, gap: 8 },
  area: { width: 240, height: 120 },
  slider: { width: 240, height: 44 },
  thumb: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatch: { width: 44, height: 44 },
  selected: { borderWidth: 3, borderColor: "#18181b" },
  input: {
    width: 88,
    height: 44,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  sideways: { height: 60, flexGrow: 0, backgroundColor: "#f4f4f5" },
  wide: { width: 800, paddingHorizontal: 24, justifyContent: "center" },
  upright: { height: 180, flexGrow: 0, backgroundColor: "#f4f4f5" },
  tall: { height: 600, paddingVertical: 20, paddingHorizontal: 24 },
})

export { Fixture }

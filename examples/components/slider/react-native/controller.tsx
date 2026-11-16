import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  createSliderController,
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  type SliderThumbState,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react-native/slider"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Example() {
  const log = useLog()
  const [volume] = useState(() => createSliderController<number>())

  return (
    <View style={styles.stack}>
      <View style={styles.actions}>
        <Action label="Mute" onPress={() => volume.setValue(0)} />
        <Action
          label="Louder"
          onPress={() => volume.setValue(volume.getValue() + 10)}
        />
        <Action
          label="Read"
          onPress={() => log(`Volume is ${volume.getValue()}`)}
        />
        <Action label="Focus" onPress={() => volume.focus()} />
      </View>
      <Field>
        <Slider
          defaultValue={40}
          controller={volume}
          onValueChange={(value, details) =>
            log(`Volume ${value} (${details.reason})`)
          }
          style={styles.slider}
        >
          <View style={styles.row}>
            <FieldLabel style={styles.label}>Volume</FieldLabel>
            <SliderValue style={styles.value} />
          </View>
          <SliderControl style={styles.control}>
            <SliderTrack style={styles.track}>
              <SliderIndicator style={styles.indicator} />
              <SliderThumb style={thumbStyle} />
            </SliderTrack>
          </SliderControl>
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
  stack: { gap: 16, alignItems: "flex-start" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
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

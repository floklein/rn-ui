import {
  createSwitchController,
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [wifi] = useState(() => createSwitchController())
  const [checked, setChecked] = useState(true)

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => wifi.toggle()}
        style={styles.button}
      >
        <Text>Toggle</Text>
      </Pressable>
      <View style={styles.row}>
        <Text style={styles.label}>Wi-Fi</Text>
        <Switch
          aria-label="Wi-Fi"
          checked={checked}
          onCheckedChange={(next, details) => {
            setChecked(next)
            log(`${next ? "On" : "Off"} (${details.reason})`)
          }}
          controller={wifi}
          style={trackStyle}
        >
          <SwitchThumb style={thumbStyle} />
        </Switch>
      </View>
    </View>
  )
}

const trackStyle = (state: SwitchState) => [
  styles.track,
  state.checked && styles.checked,
]

const thumbStyle = (state: SwitchState) => [
  styles.thumb,
  state.checked && styles.thumbOn,
]

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 16 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  track: {
    width: 52,
    height: 32,
    padding: 2,
    borderRadius: 16,
    backgroundColor: "#d4d4d8",
  },
  checked: { backgroundColor: "#16a34a" },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  thumbOn: { transform: [{ translateX: 20 }] },
})

export { Example }

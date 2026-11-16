import { Label } from "@ui-sdk/react-native/label"
import {
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { StyleSheet, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <Switch id="updates" style={trackStyle}>
        <SwitchThumb style={thumbStyle} />
      </Switch>
      <Label htmlFor="updates" style={styles.label}>
        Email me product updates
      </Label>
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
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  label: { fontSize: 16, flexShrink: 1 },
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

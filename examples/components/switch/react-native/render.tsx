import {
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Dark mode</Text>
      <Switch aria-label="Dark mode" style={trackStyle}>
        <SwitchThumb
          style={thumbStyle}
          render={(props, state) => (
            <View {...props}>
              <Text style={styles.icon}>{state.checked ? "☾" : "☀"}</Text>
            </View>
          )}
        />
      </Switch>
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
  label: { fontSize: 16 },
  icon: { fontSize: 16, textAlign: "center", lineHeight: 28 },
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

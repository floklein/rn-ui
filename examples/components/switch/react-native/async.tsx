import {
  createSwitchController,
  Switch,
  type SwitchState,
  SwitchThumb,
} from "@ui-sdk/react-native/switch"
import { useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const save = (_checked: boolean) =>
  new Promise((resolve) => setTimeout(resolve, 800))

function Example() {
  const log = useLog()
  const [backups] = useState(() => createSwitchController())
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Automatic backups</Text>
      <Switch
        aria-label="Automatic backups"
        controller={backups}
        aria-busy={saving}
        onCheckedChange={(next, details) => {
          if (details.reason === "imperative") {
            return
          }
          details.cancel()
          if (pending.current) {
            return
          }
          pending.current = true
          setSaving(true)
          log("Saving…")
          save(next).then(() => {
            pending.current = false
            backups.setChecked(next, { reason: "imperative" })
            setSaving(false)
            log(`Saved: ${next ? "on" : "off"}`)
          })
        }}
        style={trackStyle}
      >
        <SwitchThumb style={thumbStyle}>
          {saving && <ActivityIndicator size="small" />}
        </SwitchThumb>
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

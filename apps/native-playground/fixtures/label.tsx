import { Checkbox } from "@ui-sdk/react-native/checkbox"
import { Input } from "@ui-sdk/react-native/input"
import { Label } from "@ui-sdk/react-native/label"
import { Switch, SwitchThumb } from "@ui-sdk/react-native/switch"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Fixture() {
  const [disabled, setDisabled] = useState(true)
  const [alerts, setAlerts] = useState(false)
  const [terms, setTerms] = useState(false)

  return (
    <View style={styles.fixture}>
      <Text testID="readout">
        {`Alerts ${alerts ? "on" : "off"}, terms ${terms ? "accepted" : "not accepted"}`}
      </Text>
      <Pressable
        accessibilityRole="button"
        testID="toggle-disabled"
        onPress={() => setDisabled((current) => !current)}
        style={styles.action}
      >
        <Text>{disabled ? "Enable terms" : "Disable terms"}</Text>
      </Pressable>
      <View style={styles.row}>
        <Switch
          id="label-alerts"
          testID="switch-alerts"
          checked={alerts}
          onCheckedChange={setAlerts}
          style={styles.track}
        >
          <SwitchThumb style={styles.thumb} />
        </Switch>
        <Label
          htmlFor="label-alerts"
          testID="alerts-label"
          style={styles.label}
        >
          Weekly alerts
        </Label>
      </View>
      <View style={styles.row}>
        <Checkbox
          id="label-terms"
          testID="checkbox-terms"
          checked={terms}
          onCheckedChange={(checked) => setTerms(checked === true)}
          disabled={disabled}
          style={styles.box}
        />
        <Label htmlFor="label-terms" testID="terms-label" style={styles.label}>
          Accept the terms
        </Label>
      </View>
      <Label htmlFor="label-city" testID="city-label" style={styles.label}>
        City
      </Label>
      <Input
        id="label-city"
        testID="input-city"
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { gap: 16, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  action: {
    alignSelf: "flex-start",
    minHeight: 44,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  label: { minHeight: 44, lineHeight: 44 },
  input: { padding: 10, borderWidth: 1, borderRadius: 8, fontSize: 16 },
  track: {
    width: 64,
    height: 44,
    borderRadius: 22,
    padding: 4,
    backgroundColor: "#d4d4d8",
  },
  thumb: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff" },
  box: { width: 44, height: 44, borderWidth: 2, borderRadius: 8 },
})

export { Fixture }

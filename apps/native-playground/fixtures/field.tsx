import { Button } from "@ui-sdk/react-native/button"
import { Checkbox } from "@ui-sdk/react-native/checkbox"
import {
  Field,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { Radio, RadioGroup } from "@ui-sdk/react-native/radio"
import { Switch, SwitchThumb } from "@ui-sdk/react-native/switch"
import { Toggle } from "@ui-sdk/react-native/toggle"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Action({
  label,
  testID,
  onPress,
}: {
  label: string
  testID: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Fixture() {
  const [disabled, setDisabled] = useState(true)
  const [invalid, setInvalid] = useState(false)
  const [alerts, setAlerts] = useState(false)

  return (
    <View style={styles.fixture}>
      <Text testID="alerts">{alerts ? "on" : "off"}</Text>
      <View style={styles.row}>
        <Action
          label={disabled ? "Enable" : "Disable"}
          testID="toggle-disabled"
          onPress={() => setDisabled((current) => !current)}
        />
        <Action
          label="Invalid"
          testID="toggle-invalid"
          onPress={() => setInvalid((current) => !current)}
        />
      </View>
      <Field invalid={invalid} style={styles.field}>
        <FieldLabel testID="name-label" style={styles.label}>
          Name
        </FieldLabel>
        <Input testID="input-name" autoCorrect={false} style={styles.input} />
        <FieldError testID="name-error">Enter your name.</FieldError>
      </Field>
      <FieldSet disabled={disabled} style={styles.set}>
        <FieldLegend>Account</FieldLegend>
        <Field style={styles.field}>
          <FieldLabel style={styles.label}>Email</FieldLabel>
          <Input
            testID="input-email"
            autoCapitalize="none"
            style={styles.input}
          />
        </Field>
        <FieldSet style={styles.set}>
          <FieldLegend>Alerts</FieldLegend>
          <Field style={styles.row}>
            <Switch
              testID="switch-alerts"
              checked={alerts}
              onCheckedChange={setAlerts}
              style={styles.track}
            >
              <SwitchThumb style={styles.thumb} />
            </Switch>
            <FieldLabel style={styles.label}>Weekly alerts</FieldLabel>
          </Field>
          <Checkbox
            testID="checkbox-digest"
            aria-label="Digest"
            style={styles.box}
          />
          <Toggle testID="toggle-mute" aria-label="Mute" style={styles.action}>
            <Text>Mute</Text>
          </Toggle>
          <RadioGroup aria-label="Frequency" style={styles.row}>
            <Radio
              testID="radio-daily"
              aria-label="Daily"
              value="daily"
              style={styles.box}
            />
          </RadioGroup>
          <Button testID="button-test-alert" style={styles.action}>
            <Text>Test alert</Text>
          </Button>
        </FieldSet>
      </FieldSet>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { gap: 16, padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  action: { minHeight: 44, padding: 12, borderWidth: 1, borderRadius: 8 },
  label: { minHeight: 44, lineHeight: 44 },
  set: { gap: 12 },
  field: { gap: 6 },
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

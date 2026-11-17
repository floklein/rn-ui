import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { Switch, SwitchThumb } from "@ui-sdk/react-native/switch"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [open, setOpen] = useState(false)
  return (
    <View style={styles.stack}>
      <View style={styles.option}>
        <Switch
          aria-label="Open"
          checked={open}
          onCheckedChange={setOpen}
          style={(state) => [styles.switch, state.checked && styles.checked]}
        >
          <SwitchThumb
            style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
          />
        </Switch>
        <Text>Open</Text>
      </View>
      <Popover
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next)
          log(`${next ? "Opened" : "Closed"} (${details.reason})`)
        }}
      >
        <PopoverTrigger style={styles.button}>
          <Text>Set Status</Text>
        </PopoverTrigger>
        <PopoverContent style={styles.content}>
          <PopoverTitle style={styles.title}>Set a status</PopoverTitle>
          <PopoverDescription style={styles.description}>
            Your team sees it next to your name.
          </PopoverDescription>
          <Field style={styles.field}>
            <FieldLabel style={styles.label}>Status</FieldLabel>
            <Input defaultValue="In a meeting" style={styles.input} />
          </Field>
          <View style={styles.row}>
            <PopoverClose style={styles.button}>
              <Text>Cancel</Text>
            </PopoverClose>
            <PopoverClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Save</Text>
            </PopoverClose>
          </View>
        </PopoverContent>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  option: { flexDirection: "row", alignItems: "center", gap: 8 },
  switch: {
    width: 44,
    height: 26,
    padding: 2,
    borderRadius: 13,
    backgroundColor: "#d4d4d8",
  },
  checked: { backgroundColor: "#16a34a" },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff",
  },
  thumbOn: { transform: [{ translateX: 18 }] },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  solid: { backgroundColor: "#18181b", borderColor: "#18181b" },
  solidText: { color: "#fafafa", fontWeight: "500" },
  content: {
    width: 280,
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }

import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useState } from "react"
import { type HostInstance, StyleSheet, Text, View } from "react-native"

function Example() {
  const [row, setRow] = useState<HostInstance | null>(null)
  return (
    <Field style={styles.field}>
      <FieldLabel style={styles.label}>Webhook URL</FieldLabel>
      <View ref={setRow} style={styles.row}>
        <Input placeholder="https://" style={styles.input} />
        <Tooltip toggleable>
          <TooltipTrigger aria-label="About webhooks" style={styles.icon}>
            <Text style={styles.glyph}>i</Text>
          </TooltipTrigger>
          <TooltipContent
            anchor={row}
            side="bottom"
            align="start"
            style={styles.content}
          >
            <Text style={styles.text}>
              We send a POST request here for every new order.
            </Text>
          </TooltipContent>
        </Tooltip>
      </View>
    </Field>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "500" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  glyph: { fontSize: 15, fontWeight: "600" },
  content: {
    maxWidth: 280,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Example }

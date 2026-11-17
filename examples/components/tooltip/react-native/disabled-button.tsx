import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [title, setTitle] = useState("")
  const blocked = !title.trim()
  return (
    <View style={styles.stack}>
      <Field style={styles.field}>
        <FieldLabel style={styles.label}>Post title</FieldLabel>
        <Input value={title} onValueChange={setTitle} style={styles.input} />
      </Field>
      <Tooltip disabled={!blocked}>
        <TooltipTrigger
          aria-disabled={blocked || undefined}
          onPress={() => {
            if (!blocked) {
              log(`Published “${title.trim()}”`)
            }
          }}
          style={[styles.button, styles.solid, blocked && styles.blocked]}
        >
          <Text style={styles.solidText}>Publish</Text>
        </TooltipTrigger>
        <TooltipContent side="right" style={styles.content}>
          <Text style={styles.text}>Add a title to publish</Text>
        </TooltipContent>
      </Tooltip>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
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
  blocked: { opacity: 0.5 },
  content: {
    maxWidth: 240,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Example }

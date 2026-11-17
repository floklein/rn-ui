import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { Textarea } from "@ui-sdk/react-native/textarea"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [asking, setAsking] = useState(false)
  const close = () => {
    setOpen(false)
    setNote("")
    setAsking(false)
  }
  return (
    <Popover
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      dismissible={note === ""}
      onDismissAttempt={(details) => {
        log(`Kept open (${details.reason})`)
        setAsking(true)
      }}
    >
      <PopoverTrigger style={styles.button}>
        <Text>Add Note</Text>
      </PopoverTrigger>
      <PopoverContent style={styles.content}>
        <PopoverTitle style={styles.title}>Add a note</PopoverTitle>
        <PopoverDescription style={styles.description}>
          Only your team can see it.
        </PopoverDescription>
        <Field style={styles.field}>
          <FieldLabel style={styles.label}>Note</FieldLabel>
          <Textarea
            placeholder="Call the printer about the proofs."
            value={note}
            onValueChange={setNote}
            style={styles.input}
          />
        </Field>
        {asking ? (
          <View accessibilityRole="alert" style={styles.row}>
            <Text>Discard your note?</Text>
            <Pressable
              role="button"
              onPress={() => setAsking(false)}
              style={styles.button}
            >
              <Text>Keep Editing</Text>
            </Pressable>
            <Pressable
              role="button"
              onPress={() => {
                log("Discarded the note")
                close()
              }}
              style={[styles.button, styles.solid]}
            >
              <Text style={styles.solidText}>Discard</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.row}>
            <PopoverClose style={styles.button}>
              <Text>Cancel</Text>
            </PopoverClose>
            <Pressable
              role="button"
              onPress={() => {
                log(note ? "Saved the note" : "Nothing to save")
                close()
              }}
              style={[styles.button, styles.solid]}
            >
              <Text style={styles.solidText}>Save</Text>
            </Pressable>
          </View>
        )}
      </PopoverContent>
    </Popover>
  )
}

const styles = StyleSheet.create({
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
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
})

export { Example }

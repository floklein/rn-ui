import { Checkbox, CheckboxIndicator } from "@ui-sdk/react-native/checkbox"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"

const notes = {
  modal:
    "It renders in a Modal: the rest of the screen is hidden from screen readers and takes no touches.",
  beside:
    "The screen stays usable, and the escape gesture closes the notes while the screen reader is inside them.",
}

function Option({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(next) => onCheckedChange(next === true)}
      style={styles.check}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        <CheckboxIndicator>
          <View style={styles.mark} />
        </CheckboxIndicator>
      </View>
      <Text>{label}</Text>
    </Checkbox>
  )
}

function Example() {
  const [modal, setModal] = useState(false)
  const [outside, setOutside] = useState(false)
  return (
    <View style={styles.stack}>
      <View>
        <Option label="Modal" checked={modal} onCheckedChange={setModal} />
        <Option
          label="Close on outside press"
          checked={outside}
          onCheckedChange={setOutside}
        />
      </View>
      <Dialog modal={modal} closeOnOutsidePress={outside}>
        <DialogTrigger style={styles.button}>
          <Text>Open Notes</Text>
        </DialogTrigger>
        {modal && <DialogBackdrop style={styles.backdrop} />}
        <DialogContent style={modal ? styles.content : styles.card}>
          <View style={styles.stack}>
            <DialogTitle style={styles.title}>Notes</DialogTitle>
            <DialogDescription style={styles.description}>
              {modal ? notes.modal : notes.beside}
            </DialogDescription>
          </View>
          <TextInput
            aria-label="Notes"
            multiline
            defaultValue="Call the printer about the proofs."
            style={styles.input}
          />
          <View style={styles.row}>
            <DialogClose style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Done</Text>
            </DialogClose>
          </View>
        </DialogContent>
      </Dialog>
    </View>
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
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000066" },
  content: {
    marginTop: "auto",
    marginBottom: "auto",
    marginHorizontal: 24,
    gap: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  card: {
    gap: 16,
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  check: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  mark: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
})

export { Example }

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react-native/alert-dialog"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger style={styles.button}>
        <Text>Review Changes</Text>
      </AlertDialogTrigger>
      <AlertDialogBackdrop style={styles.backdrop} />
      <AlertDialogContent style={styles.content}>
        <View style={styles.stack}>
          <AlertDialogTitle style={styles.title}>
            Discard unsaved changes?
          </AlertDialogTitle>
          <AlertDialogDescription style={styles.description}>
            Your edits will be lost if you leave without saving.
          </AlertDialogDescription>
        </View>
        <View style={styles.row}>
          <AlertDialogClose style={styles.button}>
            <Text>Keep Editing</Text>
          </AlertDialogClose>
          <AlertDialogClose
            value="confirm"
            style={[styles.button, styles.solid]}
          >
            <Text style={styles.solidText}>Discard</Text>
          </AlertDialogClose>
        </View>
      </AlertDialogContent>
    </AlertDialog>
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
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }

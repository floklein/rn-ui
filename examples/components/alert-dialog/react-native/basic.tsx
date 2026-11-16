import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react-native/alert-dialog"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <AlertDialog>
      <AlertDialogTrigger style={styles.button}>
        <Text>Delete Project</Text>
      </AlertDialogTrigger>
      <AlertDialogBackdrop style={styles.backdrop} />
      <AlertDialogContent style={styles.content}>
        <View style={styles.stack}>
          <AlertDialogTitle style={styles.title}>
            Delete this project?
          </AlertDialogTitle>
          <AlertDialogDescription style={styles.description}>
            This permanently deletes the project, its files and its deployment
            history for everyone on your team.
          </AlertDialogDescription>
        </View>
        <View style={styles.row}>
          <AlertDialogClose style={styles.button}>
            <Text>Cancel</Text>
          </AlertDialogClose>
          <AlertDialogClose
            value="confirm"
            style={[styles.button, styles.solid]}
          >
            <Text style={styles.solidText}>Delete</Text>
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

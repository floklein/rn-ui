import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ui-sdk/react-native/alert-dialog"
import { useRef } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Example() {
  const attempts = useRef(0)

  async function deleteProject() {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    if (attempts.current++ === 0) {
      throw new Error("Couldn't delete the project.")
    }
  }

  return (
    <AlertDialog pendingAnnouncement="Deleting project">
      <AlertDialogTrigger style={styles.button}>
        <Text>Delete Project</Text>
      </AlertDialogTrigger>
      <AlertDialogBackdrop style={styles.backdrop} />
      <AlertDialogContent style={styles.content}>
        <View style={styles.stack}>
          <AlertDialogTitle style={styles.title}>
            Delete project?
          </AlertDialogTitle>
          <AlertDialogDescription style={styles.description}>
            This permanently deletes the project, its files and its deployment
            history for everyone on your team.
          </AlertDialogDescription>
        </View>
        <AlertDialogClose
          value="confirm"
          action={deleteProject}
          render={(props, state) => (
            <View style={styles.stack}>
              <Text role="alert" style={styles.description}>
                {state.error instanceof Error ? state.error.message : ""}
              </Text>
              <View style={styles.row}>
                <AlertDialogClose style={styles.button}>
                  <Text>Cancel</Text>
                </AlertDialogClose>
                <Pressable {...props} style={[styles.button, styles.solid]}>
                  <Text style={styles.solidText}>
                    {state.pending
                      ? "Deleting…"
                      : state.error
                        ? "Try Again"
                        : "Delete"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
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

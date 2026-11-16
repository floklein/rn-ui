import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { Linking, Pressable, StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Dialog>
      <DialogTrigger
        render={(props, state) => (
          <Pressable {...props} style={styles.button}>
            <Text>{state.open ? "Viewing" : "View Details"}</Text>
          </Pressable>
        )}
      />
      <DialogBackdrop style={styles.backdrop} />
      <DialogContent style={styles.content}>
        {(state) => (
          <>
            <View style={styles.stack}>
              <DialogTitle style={styles.title}>Details</DialogTitle>
              <DialogDescription style={styles.description}>
                {state.nested
                  ? "Opened from another dialog."
                  : "Quarterly report, updated today."}
              </DialogDescription>
            </View>
            <View style={styles.row}>
              <DialogClose style={styles.button}>
                <Text>Close</Text>
              </DialogClose>
              <DialogClose
                role="link"
                onPress={() => Linking.openURL("https://example.com/details")}
                style={[styles.button, styles.solid]}
              >
                <Text style={styles.solidText}>Open the Full Page</Text>
              </DialogClose>
            </View>
          </>
        )}
      </DialogContent>
    </Dialog>
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

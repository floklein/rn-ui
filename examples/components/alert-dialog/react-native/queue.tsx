import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  createConfirm,
} from "@ui-sdk/react-native/alert-dialog"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const [confirm] = useState(() => createConfirm<{ name: string }>())
  const log = useLog()

  async function review() {
    const acme = confirm({ name: "Acme" })
    const globex = confirm({ name: "Globex" })
    const [first, second] = await Promise.all([acme, globex])
    log(`Acme: ${first ? "confirmed" : "canceled"}`)
    log(`Globex: ${second ? "confirmed" : "canceled"}`)
  }

  return (
    <View style={styles.stack}>
      <Pressable role="button" onPress={review} style={styles.button}>
        <Text>Review Two Projects</Text>
      </Pressable>
      <AlertDialog controller={confirm.controller}>
        <AlertDialogBackdrop style={styles.backdrop} />
        <AlertDialogContent style={styles.content}>
          {(state) => {
            const { name } = (state.payload ?? {}) as { name?: string }
            return (
              <>
                <View style={styles.stack}>
                  <AlertDialogTitle style={styles.title}>
                    Archive {name}?
                  </AlertDialogTitle>
                  <AlertDialogDescription style={styles.description}>
                    Archived projects leave the active list. You can restore
                    them later.
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
                    <Text style={styles.solidText}>Archive</Text>
                  </AlertDialogClose>
                </View>
              </>
            )
          }}
        </AlertDialogContent>
      </AlertDialog>
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
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }

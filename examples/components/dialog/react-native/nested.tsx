import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Dialog>
      <DialogTrigger style={styles.button}>
        <Text>Account</Text>
      </DialogTrigger>
      <DialogBackdrop style={styles.backdrop} />
      <DialogContent style={styles.content}>
        <View style={styles.stack}>
          <DialogTitle style={styles.title}>Account</DialogTitle>
          <DialogDescription style={styles.description}>
            Manage how you sign in.
          </DialogDescription>
        </View>
        <View style={styles.card}>
          <View style={styles.stack}>
            <Text style={styles.label}>Password</Text>
            <Text style={styles.description}>Last changed 3 months ago</Text>
          </View>
          <Dialog>
            <DialogTrigger style={styles.button}>
              <Text>Change Password</Text>
            </DialogTrigger>
            <DialogBackdrop style={styles.backdrop} />
            <DialogContent style={styles.content}>
              <View style={styles.stack}>
                <DialogTitle style={styles.title}>Change password</DialogTitle>
                <DialogDescription style={styles.description}>
                  Use at least 12 characters.
                </DialogDescription>
              </View>
              <Field style={styles.stack}>
                <FieldLabel style={styles.label}>New password</FieldLabel>
                <Input secureTextEntry style={styles.input} />
              </Field>
              <View style={styles.row}>
                <DialogClose style={styles.button}>
                  <Text>Cancel</Text>
                </DialogClose>
                <DialogClose style={[styles.button, styles.solid]}>
                  <Text style={styles.solidText}>Update</Text>
                </DialogClose>
              </View>
            </DialogContent>
          </Dialog>
        </View>
        <View style={styles.row}>
          <DialogClose style={[styles.button, styles.solid]}>
            <Text style={styles.solidText}>Done</Text>
          </DialogClose>
        </View>
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
  card: {
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#e4e4e7",
  },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
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

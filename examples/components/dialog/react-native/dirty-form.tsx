import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { Field, FieldControl, FieldLabel } from "@ui-sdk/react-native/field"
import { useRef, useState } from "react"
import {
  Pressable,
  StyleSheet,
  Text,
  type TextInputInstance,
  View,
} from "react-native"

function Example() {
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [asking, setAsking] = useState(false)
  const post = useRef<TextInputInstance>(null)
  const close = () => {
    setOpen(false)
    setDirty(false)
    setAsking(false)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      dismissible={!dirty}
      onDismissAttempt={() => setAsking(true)}
    >
      <DialogTrigger style={styles.button}>
        <Text>Write a Post</Text>
      </DialogTrigger>
      <DialogBackdrop style={styles.backdrop} />
      <DialogContent style={styles.content}>
        <View style={styles.stack}>
          <DialogTitle style={styles.title}>New post</DialogTitle>
          <DialogDescription style={styles.description}>
            Share an update with your team.
          </DialogDescription>
        </View>
        <Field style={styles.stack}>
          <FieldLabel style={styles.label}>Post</FieldLabel>
          <FieldControl
            ref={post}
            multiline
            placeholder="What's new?"
            onChangeText={(text) => setDirty(text !== "")}
            style={styles.input}
          />
        </Field>
        {asking ? (
          <View role="alert" style={styles.stack}>
            <Text>Discard your changes?</Text>
            <View style={styles.row}>
              <Pressable
                role="button"
                onPress={() => {
                  setAsking(false)
                  post.current?.focus()
                }}
                style={styles.button}
              >
                <Text>Keep Editing</Text>
              </Pressable>
              <Pressable
                role="button"
                onPress={close}
                style={[styles.button, styles.solid]}
              >
                <Text style={styles.solidText}>Discard</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <DialogClose value="post" style={[styles.button, styles.solid]}>
              <Text style={styles.solidText}>Post</Text>
            </DialogClose>
          </View>
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
  label: { fontSize: 14, fontWeight: "500" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    minHeight: 96,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }

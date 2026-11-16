import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@ui-sdk/react-native/dialog"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const paragraphs = [
  "These terms govern your use of the service. By creating an account, you agree to them and to the privacy policy that explains how we handle your data.",
  "You're responsible for the content you upload and for keeping your password safe. Tell us right away if you think someone else has used your account.",
  "We may change the service, and these terms, as the product grows. When a change affects you, we'll let you know by email at least 30 days before it takes effect.",
  "You can stop using the service at any time. We'll keep your data for 30 days after you close your account, so you can export it, and then delete it.",
  "The service is provided as is. To the extent the law allows, we aren't liable for indirect damages, lost profits or lost data.",
  "If you have questions about these terms, write to us. We read every message and reply within two working days.",
]

function Example() {
  return (
    <Dialog>
      <DialogTrigger style={styles.button}>
        <Text>Scrollable Content</Text>
      </DialogTrigger>
      <DialogBackdrop style={styles.backdrop} />
      <DialogContent
        initialFocus="content"
        style={[styles.content, styles.tall]}
      >
        <View style={styles.stack}>
          <DialogTitle style={styles.title}>Terms of service</DialogTitle>
          <DialogDescription style={styles.description}>
            Please read before you continue.
          </DialogDescription>
        </View>
        <ScrollView contentContainerStyle={styles.stack}>
          {paragraphs.map((paragraph) => (
            <Text key={paragraph}>{paragraph}</Text>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <DialogClose style={styles.button}>
            <Text>Decline</Text>
          </DialogClose>
          <DialogClose value="accept" style={[styles.button, styles.solid]}>
            <Text style={styles.solidText}>Accept</Text>
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
  tall: { maxHeight: "70%" },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
})

export { Example }

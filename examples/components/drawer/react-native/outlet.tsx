import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerOutlet,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { Textarea } from "@ui-sdk/react-native/textarea"
import { StyleSheet, Text, View } from "react-native"

const messages = [
  { from: "Inès", text: "The proofs are back from the printer." },
  { from: "Kofi", text: "Lunch on Thursday?" },
  { from: "Wren", text: "Pushed the fix for the release build." },
  { from: "Tomasz", text: "Can you review the launch checklist?" },
]

function Example() {
  return (
    <Drawer>
      <DrawerOutlet
        keyframes={{ scale: [1, 0.94], borderRadius: ["0px", "24px"] }}
        style={styles.page}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Inbox</Text>
          <DrawerTrigger style={[styles.button, styles.solid]}>
            <Text style={styles.solidText}>Compose</Text>
          </DrawerTrigger>
        </View>
        {messages.map((message) => (
          <View key={message.from} style={styles.message}>
            <Text>{message.from}</Text>
            <Text style={styles.description}>{message.text}</Text>
          </View>
        ))}
      </DrawerOutlet>
      <DrawerBackdrop style={styles.backdrop} />
      <DrawerContent style={styles.content}>
        <View style={styles.grip} />
        <View style={styles.stack}>
          <DrawerTitle style={styles.title}>New message</DrawerTitle>
          <DrawerDescription style={styles.description}>
            Write a quick note to the team.
          </DrawerDescription>
        </View>
        <Field style={styles.stack}>
          <FieldLabel>To</FieldLabel>
          <Input defaultValue="Design team" style={styles.input} />
        </Field>
        <Field style={styles.stack}>
          <FieldLabel>Message</FieldLabel>
          <Textarea
            placeholder="What's new?"
            style={[styles.input, styles.area]}
          />
        </Field>
        <DrawerClose
          value="send"
          style={[styles.button, styles.solid, styles.wide]}
        >
          <Text style={styles.solidText}>Send</Text>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
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
  backdrop: { position: "absolute", inset: 0, backgroundColor: "#00000033" },
  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#ffffff",
  },
  grip: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d4d4d8",
  },
  stack: { gap: 6 },
  title: { fontSize: 17, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  wide: { alignSelf: "stretch", alignItems: "center" },
  page: {
    alignSelf: "stretch",
    gap: 8,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: { gap: 2, paddingVertical: 8 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  area: { minHeight: 80 },
})

export { Example }

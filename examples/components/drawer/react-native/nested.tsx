import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@ui-sdk/react-native/drawer"
import { Field, FieldLabel } from "@ui-sdk/react-native/field"
import { Input } from "@ui-sdk/react-native/input"
import { StyleSheet, Text, View } from "react-native"

const account = [
  { term: "Email", detail: "hollis@example.com" },
  { term: "Password", detail: "Changed 3 months ago" },
  { term: "Two-factor", detail: "On" },
]

function Example() {
  return (
    <Drawer>
      <DrawerTrigger style={styles.button}>
        <Text>Account</Text>
      </DrawerTrigger>
      <DrawerBackdrop style={styles.backdrop} />
      <DrawerContent style={styles.content}>
        <View style={styles.grip} />
        <View style={styles.stack}>
          <DrawerTitle style={styles.title}>Account</DrawerTitle>
          <DrawerDescription style={styles.description}>
            Manage how you sign in.
          </DrawerDescription>
        </View>
        <View style={styles.stack}>
          {account.map((entry) => (
            <View key={entry.term} style={styles.entry}>
              <Text>{entry.term}</Text>
              <Text style={styles.description}>{entry.detail}</Text>
            </View>
          ))}
        </View>
        <View style={styles.stack}>
          <Drawer>
            <DrawerTrigger style={[styles.button, styles.wide]}>
              <Text>Change Password</Text>
            </DrawerTrigger>
            <DrawerBackdrop style={styles.backdrop} />
            <DrawerContent style={styles.content}>
              <View style={styles.grip} />
              <View style={styles.stack}>
                <DrawerTitle style={styles.title}>Change password</DrawerTitle>
                <DrawerDescription style={styles.description}>
                  Use at least 12 characters.
                </DrawerDescription>
              </View>
              <Field style={styles.stack}>
                <FieldLabel>New password</FieldLabel>
                <Input secureTextEntry style={styles.input} />
              </Field>
              <DrawerClose style={[styles.button, styles.solid, styles.wide]}>
                <Text style={styles.solidText}>Update</Text>
              </DrawerClose>
            </DrawerContent>
          </Drawer>
          <DrawerClose style={[styles.button, styles.solid, styles.wide]}>
            <Text style={styles.solidText}>Done</Text>
          </DrawerClose>
        </View>
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
  entry: { flexDirection: "row", justifyContent: "space-between" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
})

export { Example }

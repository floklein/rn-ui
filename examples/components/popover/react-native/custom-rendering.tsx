import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { Pressable, StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Popover>
      <PopoverTrigger
        render={(props, state) => (
          <Pressable {...props} style={styles.button}>
            <Text>{state.open ? "Hide Updates" : "Show Updates"}</Text>
          </Pressable>
        )}
      />
      <PopoverContent style={styles.content}>
        <PopoverTitle style={styles.title}>Updates</PopoverTitle>
        <PopoverDescription style={styles.description}>
          Version 2.4 adds threaded comments.
        </PopoverDescription>
        <PopoverClose role="link" style={styles.link}>
          <Text style={styles.linkText}>Read the Changelog</Text>
        </PopoverClose>
      </PopoverContent>
    </Popover>
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
  content: {
    width: 260,
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
  link: { alignSelf: "flex-start" },
  linkText: { color: "#2563eb", textDecorationLine: "underline" },
})

export { Example }

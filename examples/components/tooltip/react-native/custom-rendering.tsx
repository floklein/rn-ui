import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { Pressable, StyleSheet, Text } from "react-native"

function Example() {
  return (
    <Tooltip>
      <TooltipTrigger
        role="link"
        render={(props) => (
          <Pressable {...props} style={styles.link}>
            <Text style={styles.linkText}>Changelog</Text>
          </Pressable>
        )}
      />
      <TooltipContent style={styles.content}>
        <Text style={styles.text}>See what's new in 2.0</Text>
      </TooltipContent>
    </Tooltip>
  )
}

const styles = StyleSheet.create({
  link: { alignSelf: "flex-start" },
  linkText: { fontSize: 14, color: "#2563eb", textDecorationLine: "underline" },
  content: {
    maxWidth: 240,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Example }

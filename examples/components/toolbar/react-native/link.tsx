import {
  Toolbar,
  ToolbarButton,
  ToolbarLink,
  ToolbarSeparator,
} from "@ui-sdk/react-native/toolbar"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  return (
    <Toolbar aria-label="Pull request" style={styles.toolbar}>
      <ToolbarButton
        aria-label="Approve"
        style={(_state, { pressed }) => [
          styles.item,
          pressed && styles.pressed,
        ]}
        onPress={() => log("Approved")}
      >
        <Text style={styles.glyph}>✓</Text>
      </ToolbarButton>
      <ToolbarButton
        aria-label="Comment"
        style={(_state, { pressed }) => [
          styles.item,
          pressed && styles.pressed,
        ]}
        onPress={() => log("Comment")}
      >
        <Text style={styles.glyph}>✎</Text>
      </ToolbarButton>
      <ToolbarSeparator style={styles.separator} />
      <ToolbarLink
        style={(_state, { pressed }) => [
          styles.link,
          pressed && styles.pressed,
        ]}
        onPress={() => log("Opened Files Changed")}
      >
        <Text style={styles.linkLabel}>Files Changed</Text>
      </ToolbarLink>
      <ToolbarLink
        style={(_state, { pressed }) => [
          styles.link,
          pressed && styles.pressed,
        ]}
        onPress={() => log("Opened Checks")}
      >
        <Text style={styles.linkLabel}>Checks</Text>
      </ToolbarLink>
    </Toolbar>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
  },
  item: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  pressed: { backgroundColor: "#f4f4f5" },
  glyph: { fontSize: 18, color: "#18181b" },
  separator: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    backgroundColor: "#e4e4e7",
  },
  link: { paddingHorizontal: 8, paddingVertical: 10, borderRadius: 6 },
  linkLabel: {
    fontSize: 15,
    color: "#2563eb",
    textDecorationLine: "underline",
  },
})

export { Example }

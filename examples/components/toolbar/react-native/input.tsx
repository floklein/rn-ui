import {
  Toolbar,
  ToolbarButton,
  ToolbarInput,
  ToolbarSeparator,
} from "@ui-sdk/react-native/toolbar"
import * as React from "react"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [query, setQuery] = React.useState("")
  return (
    <Toolbar aria-label="Text" style={styles.toolbar}>
      <ToolbarInput
        aria-label="Find"
        placeholder="Find…"
        value={query}
        onChangeText={setQuery}
        style={styles.field}
      />
      <ToolbarSeparator style={styles.separator} />
      <ToolbarButton
        style={(_state, { pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
        onPress={() => log(`Find next "${query}"`)}
      >
        <Text style={styles.label}>Find Next</Text>
      </ToolbarButton>
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
  field: {
    width: 160,
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 6,
    fontSize: 15,
    color: "#18181b",
  },
  separator: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    backgroundColor: "#e4e4e7",
  },
  button: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  pressed: { backgroundColor: "#f4f4f5" },
  label: { fontSize: 15, color: "#18181b" },
})

export { Example }

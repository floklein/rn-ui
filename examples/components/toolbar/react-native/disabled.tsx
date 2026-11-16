import {
  Toolbar,
  ToolbarButton,
  type ToolbarButtonState,
} from "@ui-sdk/react-native/toolbar"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  return (
    <Toolbar aria-label="Message" style={styles.toolbar}>
      <ToolbarButton style={buttonStyle} onPress={() => log("Reply")}>
        <Text style={styles.label}>Reply</Text>
      </ToolbarButton>
      <ToolbarButton
        disabled
        style={buttonStyle}
        onPress={() => log("Archive")}
      >
        <Text style={styles.label}>Archive</Text>
      </ToolbarButton>
      <ToolbarButton
        disabled
        focusableWhenDisabled={false}
        style={buttonStyle}
        onPress={() => log("Delete")}
      >
        <Text style={styles.label}>Delete</Text>
      </ToolbarButton>
    </Toolbar>
  )
}

const buttonStyle = (
  state: ToolbarButtonState,
  { pressed }: { pressed: boolean }
) => [
  styles.button,
  pressed && styles.pressed,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
  },
  button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  pressed: { backgroundColor: "#f4f4f5" },
  disabled: { opacity: 0.5 },
  label: { fontSize: 15, color: "#18181b" },
})

export { Example }

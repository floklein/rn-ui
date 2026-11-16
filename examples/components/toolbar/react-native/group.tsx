import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
  type ToolbarButtonState,
} from "@ui-sdk/react-native/toolbar"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

const clipboard = [
  { label: "Cut", glyph: "✂" },
  { label: "Copy", glyph: "⧉" },
  { label: "Paste", glyph: "⎘" },
]

function Example() {
  const log = useLog()
  return (
    <Toolbar aria-label="Edit" style={styles.toolbar}>
      <ToolbarGroup aria-label="Clipboard" style={styles.group}>
        {clipboard.map(({ label, glyph }) => (
          <ToolbarButton
            key={label}
            aria-label={label}
            style={buttonStyle}
            onPress={() => log(label)}
          >
            <Text style={styles.glyph}>{glyph}</Text>
          </ToolbarButton>
        ))}
      </ToolbarGroup>
      <ToolbarSeparator style={styles.separator} />
      <ToolbarGroup disabled aria-label="History" style={styles.group}>
        <ToolbarButton aria-label="Undo" style={buttonStyle}>
          <Text style={styles.glyph}>↶</Text>
        </ToolbarButton>
        <ToolbarButton aria-label="Redo" style={buttonStyle}>
          <Text style={styles.glyph}>↷</Text>
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  )
}

const buttonStyle = (
  state: ToolbarButtonState,
  { pressed }: { pressed: boolean }
) => [styles.item, pressed && styles.pressed, state.disabled && styles.disabled]

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
  group: { flexDirection: "row", gap: 4 },
  item: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  pressed: { backgroundColor: "#f4f4f5" },
  disabled: { opacity: 0.4 },
  glyph: { fontSize: 18, color: "#18181b" },
  separator: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    backgroundColor: "#e4e4e7",
  },
})

export { Example }

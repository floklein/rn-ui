import {
  Toggle,
  ToggleGroup,
  ToggleIcon,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import { Toolbar, ToolbarSeparator } from "@ui-sdk/react-native/toolbar"
import { StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

const alignments = [
  { value: "left", label: "Align left", glyph: "⇤" },
  { value: "center", label: "Align center", glyph: "↔" },
  { value: "right", label: "Align right", glyph: "⇥" },
]

const lists = [
  { value: "bulleted", label: "Bulleted list", glyph: "•" },
  { value: "numbered", label: "Numbered list", glyph: "1." },
]

function Example() {
  const log = useLog()
  return (
    <Toolbar aria-label="Paragraph" style={styles.toolbar}>
      <ToggleGroup
        defaultValue={["left"]}
        deselectable={false}
        aria-label="Alignment"
        style={styles.group}
        onValueChange={([value]) => log(`Align ${value}`)}
      >
        {alignments.map(({ value, label, glyph }) => (
          <Toggle
            key={value}
            value={value}
            aria-label={label}
            style={toggleStyle}
          >
            {(state) => (
              <ToggleIcon>
                <Text
                  style={[styles.glyph, state.pressed && styles.glyphPressed]}
                >
                  {glyph}
                </Text>
              </ToggleIcon>
            )}
          </Toggle>
        ))}
      </ToggleGroup>
      <ToolbarSeparator style={styles.separator} />
      <ToggleGroup
        aria-label="List"
        style={styles.group}
        onValueChange={([value]) =>
          log(lists.find((list) => list.value === value)?.label ?? "No list")
        }
      >
        {lists.map(({ value, label, glyph }) => (
          <Toggle
            key={value}
            value={value}
            aria-label={label}
            style={toggleStyle}
          >
            {(state) => (
              <ToggleIcon>
                <Text
                  style={[styles.glyph, state.pressed && styles.glyphPressed]}
                >
                  {glyph}
                </Text>
              </ToggleIcon>
            )}
          </Toggle>
        ))}
      </ToggleGroup>
    </Toolbar>
  )
}

const toggleStyle = (state: ToggleState) => [
  styles.item,
  state.pressed && styles.pressed,
]

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
  pressed: { backgroundColor: "#18181b" },
  glyph: { fontSize: 18, color: "#18181b" },
  glyphPressed: { color: "#ffffff" },
  separator: {
    width: 1,
    alignSelf: "stretch",
    marginHorizontal: 4,
    backgroundColor: "#e4e4e7",
  },
})

export { Example }

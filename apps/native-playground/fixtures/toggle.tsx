import {
  Toggle,
  ToggleGroup,
  type ToggleState,
} from "@ui-sdk/react-native/toggle"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const toggleStyle = (state: ToggleState) => [
  styles.toggle,
  state.pressed && styles.pressed,
  state.disabled && styles.disabled,
]

function Item({ value, label }: { value: string; label: string }) {
  return (
    <Toggle
      value={value}
      aria-label={label}
      testID={`toggle-${value}`}
      style={toggleStyle}
    >
      <Text>{label}</Text>
    </Toggle>
  )
}

function Fixture() {
  const [changes, setChanges] = useState<string[]>([])
  const [formats, setFormats] = useState("none")
  const [align, setAlign] = useState<string[]>(["start"])
  const [strike, setStrike] = useState(false)
  const memoized = useMemo(
    () => ({
      bold: <Item value="bold" label="Bold" />,
      italic: <Item value="italic" label="Italic" />,
      underline: <Item value="underline" label="Underline" />,
    }),
    []
  )

  return (
    <View style={styles.fixture}>
      <View style={styles.row}>
        <Toggle
          aria-label="Bookmark"
          testID="toggle-bookmark"
          onPressedChange={(pressed, details) =>
            setChanges((current) => [
              ...current,
              `${pressed}:${details.source}`,
            ])
          }
          style={toggleStyle}
        >
          <Text>Bookmark</Text>
        </Toggle>
        <Toggle
          aria-label="Pin"
          testID="toggle-pin"
          disabled
          onPressedChange={() =>
            setChanges((current) => [...current, "pin"])
          }
          style={toggleStyle}
        >
          <Text>Pin</Text>
        </Toggle>
      </View>
      <Text testID="bookmark-changes">{changes.join(" ") || "none"}</Text>
      <ToggleGroup
        multiple
        aria-label="Text formatting"
        onValueChange={(value, details) =>
          setFormats(`${value.join(",") || "none"}:${details.source}`)
        }
        style={styles.row}
      >
        {memoized.bold}
        {memoized.italic}
        {strike && <Item value="strike" label="Strikethrough" />}
        {memoized.underline}
      </ToggleGroup>
      <Text testID="format-value">{formats}</Text>
      <ToggleGroup
        value={align}
        onValueChange={setAlign}
        deselectable={false}
        aria-label="Text alignment"
        style={styles.row}
      >
        <Item value="start" label="Start" />
        <Item value="center" label="Center" />
        <Item value="end" label="End" />
      </ToggleGroup>
      <Text testID="align-value">{align.join(",") || "none"}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="add-strike"
          onPress={() => setStrike(true)}
          style={styles.action}
        >
          <Text>Add Strikethrough</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  pressed: { backgroundColor: "#e4e4e7" },
  disabled: { opacity: 0.5 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }

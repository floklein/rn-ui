import {
  createInputController,
  Input,
  InputClear,
  InputGroup,
  type InputOptions,
} from "@ui-sdk/react-native/input"
import { Textarea } from "@ui-sdk/react-native/textarea"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

type Change = NonNullable<InputOptions["onValueChange"]>

function Action({
  label,
  testID,
  onPress,
}: {
  label: string
  testID: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

function Fixture() {
  const [email] = useState(createInputController)
  const [notes] = useState(createInputController)
  const [values, setValues] = useState({
    email: "",
    notes: "",
    search: "lisbon",
  })
  const [changes, setChanges] = useState<string[]>([])
  const record =
    (name: keyof typeof values): Change =>
    (value, details) => {
      setValues((current) => ({ ...current, [name]: value }))
      setChanges((current) => [
        ...current,
        `${name}:${details.reason}:${details.source}`,
      ])
    }

  return (
    <View style={styles.fixture}>
      <Text testID="values">{JSON.stringify(values)}</Text>
      <Text testID="changes">{changes.join(" ") || "none"}</Text>
      <Input
        aria-label="Email"
        testID="input-email"
        controller={email}
        autoCapitalize="none"
        autoCorrect={false}
        onValueChange={record("email")}
        style={styles.input}
      />
      <Textarea
        aria-label="Notes"
        testID="textarea-notes"
        controller={notes}
        autoCorrect={false}
        onValueChange={record("notes")}
        style={[styles.input, styles.textarea]}
      />
      <InputGroup style={styles.group}>
        <Text testID="search-affix">Find</Text>
        <Input
          aria-label="Search"
          testID="input-search"
          defaultValue="lisbon"
          autoCorrect={false}
          onValueChange={record("search")}
          style={styles.grow}
        />
        <InputClear
          aria-label="Clear search"
          testID="clear-search"
          style={styles.clear}
        >
          <Text>×</Text>
        </InputClear>
      </InputGroup>
      <Input
        aria-label="Account"
        testID="input-disabled"
        defaultValue="hollis"
        disabled
        style={styles.input}
      />
      <View style={styles.actions}>
        <Action
          label="Focus email"
          testID="focus-email"
          onPress={() => email.focus()}
        />
        <Action
          label="Focus notes"
          testID="focus-notes"
          onPress={() => notes.focus()}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    fontSize: 16,
  },
  textarea: { minHeight: 64, textAlignVertical: "top" },
  group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  grow: { flex: 1, paddingVertical: 8, fontSize: 16 },
  clear: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }

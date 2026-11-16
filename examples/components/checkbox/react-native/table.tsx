import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  type CheckboxState,
} from "@ui-sdk/react-native/checkbox"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const people = [
  {
    id: "hollis",
    name: "Hollis Grant",
    email: "hollis@example.com",
    role: "Owner",
  },
  {
    id: "ines",
    name: "Inès Moreau",
    email: "ines@example.com",
    role: "Editor",
  },
  {
    id: "kofi",
    name: "Kofi Mensah",
    email: "kofi@example.com",
    role: "Viewer",
  },
  {
    id: "wren",
    name: "Wren Takahashi",
    email: "wren@example.com",
    role: "Editor",
  },
]

function Example() {
  const log = useLog()
  const [selected, setSelected] = useState(["hollis"])

  return (
    <CheckboxGroup
      aria-label="Team members"
      value={selected}
      onValueChange={(next) => {
        setSelected(next)
        log(`${next.length} of ${people.length} selected`)
      }}
      allValues={people.map((person) => person.id)}
      style={styles.table}
    >
      <View style={[styles.row, styles.header]}>
        <Checkbox aria-label="Select all" parent style={boxStyle}>
          <CheckboxIndicator>
            {(state) => (
              <View style={state.indeterminate ? styles.dash : styles.check} />
            )}
          </CheckboxIndicator>
        </Checkbox>
        <Text style={[styles.cell, styles.strong]}>Name</Text>
        <Text style={[styles.cell, styles.strong]}>Role</Text>
      </View>
      {people.map((person) => (
        <View key={person.id} style={styles.row}>
          <Checkbox
            value={person.id}
            aria-label={`Select ${person.name}`}
            style={boxStyle}
          >
            <CheckboxIndicator>
              <View style={styles.check} />
            </CheckboxIndicator>
          </Checkbox>
          <View style={styles.cell}>
            <Text>{person.name}</Text>
            <Text style={styles.hint}>{person.email}</Text>
          </View>
          <Text style={styles.cell}>{person.role}</Text>
        </View>
      ))}
    </CheckboxGroup>
  )
}

const boxStyle = (state: CheckboxState) => [
  styles.box,
  state.checked !== false && styles.boxChecked,
]

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#e4e4e7",
  },
  header: { borderTopWidth: 0 },
  cell: { flex: 1 },
  strong: { fontWeight: "600" },
  hint: { fontSize: 13, color: "#71717a" },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#a1a1aa",
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: "#16a34a", borderColor: "#16a34a" },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#ffffff",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  dash: { width: 10, height: 2, backgroundColor: "#ffffff" },
})

export { Example }

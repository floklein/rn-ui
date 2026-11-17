import {
  NumberInput,
  NumberInputControl,
  NumberInputGroup,
  NumberInputScrubArea,
} from "@ui-sdk/react-native/number-input"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const fields = [
  { label: "X position", handle: "X", defaultValue: 120 },
  { label: "Y position", handle: "Y", defaultValue: 48 },
  { label: "Width", handle: "W", defaultValue: 320, min: 0 },
  { label: "Height", handle: "H", defaultValue: 240, min: 0 },
]

function Example() {
  const log = useLog()

  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Frame
      </Text>
      <View style={styles.grid}>
        {fields.map(({ label, handle, ...options }) => (
          <NumberInput
            key={label}
            {...options}
            onValueCommit={(value) => log(`${label} ${value ?? "empty"}`)}
            style={styles.cell}
          >
            <NumberInputGroup style={styles.group}>
              <NumberInputScrubArea pixelsPerStep={1} style={styles.scrub}>
                <Text
                  importantForAccessibility="no"
                  accessibilityElementsHidden
                >
                  {handle}
                </Text>
              </NumberInputScrubArea>
              <NumberInputControl aria-label={label} style={styles.control} />
            </NumberInputGroup>
          </NumberInput>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
  },
  title: { fontSize: 16, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "48%" },
  group: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 36,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  scrub: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  control: { flex: 1, paddingHorizontal: 8, fontSize: 15, color: "#18181b" },
})

export { Example }

import { Separator, type SeparatorState } from "@ui-sdk/react-native/separator"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.stack}>
      <View style={styles.heading}>
        <Text style={styles.title}>Hollis Grant</Text>
        <Text style={styles.hint}>hollis@example.com</Text>
      </View>
      <Separator style={lineStyle} />
      <Text>
        Designs the billing and onboarding flows, and reviews every new pricing
        page.
      </Text>
    </View>
  )
}

const lineStyle = (state: SeparatorState) => [
  styles.line,
  state.orientation === "vertical" ? styles.vertical : styles.horizontal,
]

const styles = StyleSheet.create({
  stack: { gap: 12, width: 320, maxWidth: "100%" },
  heading: { gap: 4 },
  title: { fontSize: 17, fontWeight: "600" },
  hint: { fontSize: 13, color: "#71717a" },
  line: { backgroundColor: "#e4e4e7" },
  horizontal: { height: 1, alignSelf: "stretch" },
  vertical: { width: 1, alignSelf: "stretch" },
})

export { Example }

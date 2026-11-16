import { Button, type ButtonState } from "@ui-sdk/react-native/button"
import { Linking, StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <View style={styles.row}>
      <Button
        role="link"
        onPress={() => Linking.openURL("https://reactnative.dev")}
        style={linkStyle}
      >
        <Text style={styles.label}>Get Started</Text>
      </Button>
      <Button
        role="link"
        disabled
        onPress={() => Linking.openURL("https://reactnative.dev/blog")}
        style={linkStyle}
      >
        <Text style={styles.label}>Changelog</Text>
      </Button>
    </View>
  )
}

const linkStyle = (state: ButtonState) => [
  styles.link,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16 },
  link: { paddingVertical: 10 },
  disabled: { opacity: 0.5 },
  label: { color: "#2563eb", fontSize: 16, textDecorationLine: "underline" },
})

export { Example }

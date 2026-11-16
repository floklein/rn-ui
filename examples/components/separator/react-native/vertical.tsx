import { Separator } from "@ui-sdk/react-native/separator"
import { Fragment } from "react"
import { Linking, StyleSheet, Text, View } from "react-native"

const links = [
  { label: "Privacy", url: "https://example.com/privacy" },
  { label: "Terms", url: "https://example.com/terms" },
  { label: "Cookies", url: "https://example.com/cookies" },
]

function Example() {
  return (
    <View style={styles.row}>
      {links.map((link, index) => (
        <Fragment key={link.label}>
          {index > 0 && (
            <Separator orientation="vertical" style={styles.line} />
          )}
          <Text
            role="link"
            onPress={() => Linking.openURL(link.url)}
            style={styles.link}
          >
            {link.label}
          </Text>
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16 },
  line: { width: 1, backgroundColor: "#e4e4e7" },
  link: { color: "#2563eb", textDecorationLine: "underline" },
})

export { Example }

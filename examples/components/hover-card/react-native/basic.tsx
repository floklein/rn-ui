import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@ui-sdk/react-native/hover-card"
import { Linking, StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <HoverCard defaultOpen>
      <HoverCardTrigger
        onPress={() => Linking.openURL("https://example.com/people/hollis")}
      >
        <Text style={styles.link}>@hollis</Text>
      </HoverCardTrigger>
      <HoverCardContent style={styles.card}>
        <View style={styles.row}>
          <View style={styles.initials} aria-hidden>
            <Text style={styles.initialsText}>HG</Text>
          </View>
          <View style={styles.stack}>
            <Text style={styles.name}>Hollis Grant</Text>
            <Text style={styles.bio}>
              Design engineer on the payments team. Writes about forms and
              motion.
            </Text>
            <Text style={styles.hint}>Joined March 2021</Text>
          </View>
        </View>
      </HoverCardContent>
    </HoverCard>
  )
}

const styles = StyleSheet.create({
  link: { color: "#2563eb", textDecorationLine: "underline" },
  card: {
    width: 280,
    padding: 14,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  row: { flexDirection: "row", gap: 12 },
  initials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  initialsText: { fontWeight: "600" },
  stack: { flex: 1, gap: 4 },
  name: { fontWeight: "600" },
  bio: { fontSize: 13, color: "#3f3f46" },
  hint: { fontSize: 12, color: "#71717a" },
})

export { Example }

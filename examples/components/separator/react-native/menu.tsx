import { Separator } from "@ui-sdk/react-native/separator"
import { Fragment } from "react"
import { StyleSheet, Text, View } from "react-native"

const stats = [
  { value: "24", label: "Projects" },
  { value: "1,280", label: "Followers" },
  { value: "312", label: "Following" },
]

function Example() {
  return (
    <View style={styles.row}>
      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          {index > 0 && (
            <Separator orientation="vertical" style={styles.line} />
          )}
          <View style={styles.stat}>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.hint}>{stat.label}</Text>
          </View>
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 16, width: 320, maxWidth: "100%" },
  stat: { flex: 1, gap: 2 },
  value: { fontSize: 18, fontWeight: "600", fontVariant: ["tabular-nums"] },
  hint: { fontSize: 13, color: "#71717a" },
  line: { width: 1, backgroundColor: "#e4e4e7" },
})

export { Example }

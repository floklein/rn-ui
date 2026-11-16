import { Separator } from "@ui-sdk/react-native/separator"
import { Fragment } from "react"
import { StyleSheet, Text, View } from "react-native"

const details = [
  { term: "Plan", value: "Pro" },
  { term: "Seats", value: "8 of 10" },
  { term: "Renews", value: "December 1, 2026" },
]

function Example() {
  return (
    <View style={styles.stack}>
      {details.map((detail, index) => (
        <Fragment key={detail.term}>
          {index > 0 && <Separator style={styles.line} />}
          <View style={styles.row}>
            <Text style={styles.hint}>{detail.term}</Text>
            <Text>{detail.value}</Text>
          </View>
        </Fragment>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12, width: 320, maxWidth: "100%" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  hint: { color: "#71717a" },
  line: { height: 1, backgroundColor: "#e4e4e7" },
})

export { Example }

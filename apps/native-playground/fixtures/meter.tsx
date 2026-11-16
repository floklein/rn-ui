import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@ui-sdk/react-native/meter"
import { StyleSheet, View } from "react-native"

function Fixture() {
  return (
    <View style={styles.fixture}>
      <Meter value={-5} min={-10} max={10} testID="meter" style={styles.bar}>
        <MeterLabel testID="meter-label">Balance</MeterLabel>
        <MeterValue testID="meter-value" />
        <MeterTrack testID="track" style={styles.track}>
          <MeterIndicator testID="indicator" style={styles.indicator} />
        </MeterTrack>
      </Meter>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16 },
  bar: { flexDirection: "row", flexWrap: "wrap", gap: 8, minHeight: 44 },
  track: {
    flexDirection: "row",
    width: 200,
    height: 10,
    backgroundColor: "#e4e4e7",
  },
  indicator: { height: "100%", backgroundColor: "#18181b" },
})

export { Fixture }

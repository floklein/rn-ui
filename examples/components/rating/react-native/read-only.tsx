import { Rating, RatingItem } from "@ui-sdk/react-native/rating"
import { StyleSheet, Text, View } from "react-native"

function Example() {
  return (
    <Rating
      value={4.2}
      readOnly
      getValueLabel={(value, max) => `Rated ${value} out of ${max}`}
      style={styles.rating}
    >
      <RatingItem>
        {(state) => (
          <View aria-hidden style={styles.star}>
            <Text style={styles.empty}>★</Text>
            <View style={[styles.fill, { width: `${state.fill * 100}%` }]}>
              <Text style={styles.full}>★</Text>
            </View>
          </View>
        )}
      </RatingItem>
    </Rating>
  )
}

const styles = StyleSheet.create({
  rating: { flexDirection: "row", gap: 2 },
  star: { width: 32, height: 32 },
  empty: {
    fontSize: 28,
    lineHeight: 32,
    textAlign: "center",
    color: "#d4d4d8",
  },
  fill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    start: 0,
    overflow: "hidden",
  },
  full: {
    width: 32,
    fontSize: 28,
    lineHeight: 32,
    textAlign: "center",
    color: "#f59e0b",
  },
})

export { Example }

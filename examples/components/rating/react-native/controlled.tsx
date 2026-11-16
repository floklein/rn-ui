import {
  createRatingController,
  Rating,
  RatingItem,
} from "@ui-sdk/react-native/rating"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [rating] = useState(() => createRatingController())
  const [value, setValue] = useState<number | null>(4)

  return (
    <View style={styles.stack}>
      <Pressable
        accessibilityRole="button"
        onPress={() => rating.setValue(null)}
        style={styles.button}
      >
        <Text>Clear Rating</Text>
      </Pressable>
      <Rating
        aria-label="Rating"
        value={value}
        onValueChange={(next, details) => {
          setValue(next)
          log(`value: ${next} (${details.reason})`)
        }}
        controller={rating}
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
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16, alignItems: "flex-start" },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
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

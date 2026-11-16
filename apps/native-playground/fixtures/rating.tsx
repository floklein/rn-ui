import {
  createRatingController,
  Rating,
  RatingItem,
  type RatingItemState,
} from "@ui-sdk/react-native/rating"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

function Star({ state }: { state: RatingItemState }) {
  return (
    <View aria-hidden style={styles.star}>
      <Text style={styles.empty}>★</Text>
      <View style={[styles.fill, { width: `${state.fill * 100}%` }]}>
        <Text style={styles.full}>★</Text>
      </View>
    </View>
  )
}

const stars = <RatingItem>{(state) => <Star state={state} />}</RatingItem>

function Fixture() {
  const [food, setFood] = useState("none")
  const [room, setRoom] = useState("none")
  const [controller] = useState(() => createRatingController())

  return (
    <View style={styles.fixture}>
      <Text testID="food-value">{food}</Text>
      <Text testID="room-value">{room}</Text>
      <Rating
        aria-label="Food"
        testID="rating-food"
        getValueLabel={(value) => `Food ${value}`}
        controller={controller}
        onValueChange={(value, details) =>
          setFood(`${value}:${details.source}`)
        }
        style={styles.rating}
      >
        {stars}
      </Rating>
      <Rating
        aria-label="Room"
        testID="rating-room"
        step={0.5}
        defaultValue={2.5}
        deselectable
        getValueLabel={(value) => `Room ${value}`}
        onValueChange={(value) => setRoom(String(value))}
        style={styles.rating}
      >
        {stars}
      </Rating>
      <Rating
        aria-label="Service"
        testID="rating-service"
        disabled
        defaultValue={2}
        max={3}
        getValueLabel={(value) => `Service ${value}`}
        onValueChange={() => setFood("service")}
        style={styles.rating}
      >
        {stars}
      </Rating>
      <Rating
        readOnly
        value={4.2}
        getValueLabel={(value, max) => `Rated ${value} out of ${max}`}
        style={styles.rating}
      >
        {stars}
      </Rating>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          testID="set-food"
          onPress={() => controller.setValue(1)}
          style={styles.action}
        >
          <Text>Set Food to 1</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  rating: { flexDirection: "row", gap: 2 },
  star: { width: 40, height: 40 },
  empty: {
    fontSize: 34,
    lineHeight: 40,
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
    width: 40,
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
    color: "#f59e0b",
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }

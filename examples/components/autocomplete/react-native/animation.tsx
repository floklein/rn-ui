import { useEffect, useState } from "react"
import { useLog } from "../../../shared/react/log"
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  type AutocompleteItemState,
  AutocompleteLabel,
  AutocompleteList,
  type AutocompletePlacementState,
} from "@ui-sdk/react-native/autocomplete"
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native"

const fruits = [
  "Apple",
  "Apricot",
  "Avocado",
  "Banana",
  "Blackberry",
  "Blueberry",
  "Cherry",
  "Grape",
  "Lemon",
  "Mango",
  "Orange",
  "Peach",
  "Pear",
  "Pineapple",
  "Strawberry",
]

function Example() {
  const log = useLog()
  const [progress] = useState(() => new Animated.Value(0))
  return (
    <Autocomplete
      onOpenChangeComplete={(open) =>
        log(open ? "Finished opening" : "Finished closing")
      }
    >
      <View style={styles.field}>
        <AutocompleteLabel style={styles.label}>
          Favorite fruit
        </AutocompleteLabel>
        <AutocompleteInput style={styles.input} placeholder="e.g. Mango" />
      </View>
      <AutocompleteContent
        render={
          <Animated.View
            style={{
              opacity: progress,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-4, 0],
                  }),
                },
              ],
            }}
          />
        }
        style={(state) => [
          ...contentStyle(state),
          { transformOrigin: state.transformOrigin },
        ]}
        onExit={(done) => fade(progress, 0).start(() => done())}
      >
        <Enter progress={progress} />
        <AutocompleteEmpty>
          <Text style={styles.empty}>No fruits found.</Text>
        </AutocompleteEmpty>
        <ScrollView keyboardShouldPersistTaps="handled">
          <AutocompleteList>
            {fruits.map((fruit) => (
              <AutocompleteItem key={fruit} value={fruit} style={itemStyle}>
                <Text style={styles.itemText}>{fruit}</Text>
              </AutocompleteItem>
            ))}
          </AutocompleteList>
        </ScrollView>
      </AutocompleteContent>
    </Autocomplete>
  )
}

const fade = (progress: Animated.Value, toValue: number) =>
  Animated.timing(progress, { toValue, duration: 150, useNativeDriver: true })

function Enter({ progress }: { progress: Animated.Value }) {
  useEffect(() => {
    fade(progress, 1).start()
  }, [progress])
  return null
}

const itemStyle = (
  state: AutocompleteItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
  state.disabled && styles.disabled,
]

const contentStyle = (state: AutocompletePlacementState) => [
  styles.content,
  { maxHeight: Math.min(280, state.availableHeight ?? 280) },
]

const styles = StyleSheet.create({
  content: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  disabled: { opacity: 0.4 },
  empty: { padding: 10, fontSize: 14, color: "#71717a" },
  field: { width: 260, gap: 6 },
  highlighted: { backgroundColor: "#f4f4f5" },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
    backgroundColor: "#ffffff",
    fontSize: 16,
    color: "#18181b",
  },
  item: { paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8 },
  itemText: { fontSize: 16 },
  label: { fontSize: 14, fontWeight: "500" },
})

export { Example }

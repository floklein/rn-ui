import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselStepState,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import {
  SegmentedControl,
  SegmentedControlIndicator,
  type SegmentedControlIndicatorState,
  SegmentedControlItem,
} from "@ui-sdk/react-native/segmented-control"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"

const photos = [
  { name: "Dunes" },
  { name: "Forest" },
  { name: "Glacier" },
  { name: "Canyon" },
  { name: "Meadow" },
  { name: "Harbor" },
]
const alignments = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
] as const

function Example() {
  const [align, setAlign] = useState<"start" | "center" | "end">("center")

  return (
    <View style={styles.stack}>
      <SegmentedControl
        aria-label="Align"
        value={align}
        onValueChange={(next) => setAlign(next as typeof align)}
        style={styles.control}
      >
        <SegmentedControlIndicator style={indicatorStyle} />
        {alignments.map((option) => (
          <SegmentedControlItem
            key={option.value}
            value={option.value}
            style={styles.option}
          >
            <Text style={styles.label}>{option.label}</Text>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <Carousel aria-label="Photos" align={align} defaultPage={2}>
        <View style={styles.row}>
          <CarouselPrevious aria-label="Previous slide" style={stepStyle}>
            <Text style={styles.arrow}>‹</Text>
          </CarouselPrevious>
          <CarouselViewport style={styles.viewport}>
            <CarouselContent>
              {photos.map((photo) => (
                <CarouselItem key={photo.name} style={styles.item}>
                  <View style={styles.tile}>
                    <Text style={styles.name}>{photo.name}</Text>
                  </View>
                </CarouselItem>
              ))}
            </CarouselContent>
          </CarouselViewport>
          <CarouselNext aria-label="Next slide" style={stepStyle}>
            <Text style={styles.arrow}>›</Text>
          </CarouselNext>
        </View>
      </Carousel>
    </View>
  )
}

const stepStyle = (state: CarouselStepState) => [
  styles.step,
  state.disabled && styles.disabled,
]

const indicatorStyle = (state: SegmentedControlIndicatorState) => [
  styles.indicator,
  {
    left: state.indicatorLeft,
    top: state.indicatorTop,
    width: state.indicatorWidth,
    height: state.indicatorHeight,
  },
]

const styles = StyleSheet.create({
  stack: { width: 320, maxWidth: "100%", gap: 12 },
  control: {
    flexDirection: "row",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#f4f4f5",
  },
  option: { paddingHorizontal: 16, paddingVertical: 8 },
  label: { fontSize: 14, fontWeight: "500" },
  indicator: {
    position: "absolute",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewport: { flex: 1 },
  item: { width: "70%", paddingHorizontal: 4 },
  tile: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
  },
  name: { fontSize: 20, fontWeight: "600" },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  disabled: { opacity: 0.4 },
  arrow: { fontSize: 22 },
})

export { Example }

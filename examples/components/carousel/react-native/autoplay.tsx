import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPlayToggle,
  CarouselPrevious,
  type CarouselStepState,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

const photos = [
  { name: "Dunes" },
  { name: "Forest" },
  { name: "Glacier" },
  { name: "Canyon" },
  { name: "Meadow" },
  { name: "Harbor" },
]

function Example() {
  const log = useLog()
  return (
    <Carousel
      aria-label="Photos"
      defaultPlaying
      interval={4000}
      onPlayingChange={(playing, details) =>
        log(`${playing ? "Playing" : "Stopped"} (${details.reason})`)
      }
      style={styles.carousel}
    >
      <CarouselPlayToggle style={styles.toggle}>
        {(state) => (
          <Text style={styles.label}>{state.playing ? "Pause" : "Play"}</Text>
        )}
      </CarouselPlayToggle>
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
  )
}

const stepStyle = (state: CarouselStepState) => [
  styles.step,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  carousel: { width: 320, maxWidth: "100%", gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewport: { flex: 1, borderRadius: 12 },
  item: { width: "100%" },
  tile: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#f4f4f5",
  },
  name: { fontSize: 20, fontWeight: "600" },
  toggle: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  label: { fontSize: 14, fontWeight: "500" },
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

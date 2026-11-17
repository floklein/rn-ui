import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  type CarouselIndicatorState,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselViewport,
} from "@ui-sdk/react-native/carousel"
import { useState } from "react"
import { ScrollView, StyleSheet, Text, View } from "react-native"

const slides = ["Dunes", "Forest", "Glacier", "Canyon"]

function Slides({ prefix }: { prefix: string }) {
  return (
    <CarouselContent>
      {slides.map((name) => (
        <CarouselItem
          key={name}
          testID={`${prefix}-${name}`}
          style={styles.item}
        >
          <View style={styles.tile}>
            <Text>{name}</Text>
          </View>
        </CarouselItem>
      ))}
    </CarouselContent>
  )
}

const dragging = (set: (value: boolean) => void) => ({
  onResponderGrant: () => set(true),
  onResponderRelease: () => set(false),
  onResponderTerminate: () => set(false),
})

function Fixture() {
  const [page, setPage] = useState(1)
  const [rested, setRested] = useState(1)
  const [gallery, setGallery] = useState(1)
  const [held, setHeld] = useState(false)
  const [scrolled, setScrolled] = useState(0)
  const [upright, setUpright] = useState(1)
  const [lifted, setLifted] = useState(0)

  return (
    <ScrollView
      testID="upright"
      onScroll={(event) =>
        setLifted(Math.round(event.nativeEvent.contentOffset.y))
      }
      scrollEventThrottle={16}
      style={styles.page}
    >
      <Text testID="readout">{`Page ${page}, rested ${rested}`}</Text>
      <Text testID="scroll-readout">
        {`Gallery ${gallery}, scrolled ${scrolled}; upright ${upright}, lifted ${lifted}`}
      </Text>
      <Carousel
        aria-label="Photos"
        onPageChange={setPage}
        onPageChangeComplete={setRested}
        style={styles.carousel}
      >
        <CarouselViewport testID="viewport" style={styles.viewport}>
          <Slides prefix="slide" />
        </CarouselViewport>
        <View style={styles.row}>
          <CarouselPrevious
            testID="previous"
            aria-label="Previous slide"
            style={styles.step}
          >
            <Text>‹</Text>
          </CarouselPrevious>
          <CarouselIndicatorGroup aria-label="Slides" style={styles.row}>
            {slides.map((name) => (
              <CarouselIndicator
                key={name}
                testID={`dot-${name}`}
                aria-label={name}
                style={dotStyle}
              />
            ))}
          </CarouselIndicatorGroup>
          <CarouselNext
            testID="next"
            aria-label="Next slide"
            style={styles.step}
          >
            <Text>›</Text>
          </CarouselNext>
        </View>
      </Carousel>
      <ScrollView
        horizontal
        scrollEnabled={!held}
        testID="sideways"
        onScroll={(event) =>
          setScrolled(Math.round(event.nativeEvent.contentOffset.x))
        }
        scrollEventThrottle={16}
        style={styles.sideways}
      >
        <View style={styles.wide}>
          <Carousel
            aria-label="Gallery"
            onPageChange={setGallery}
            style={styles.carousel}
          >
            <CarouselViewport
              testID="gallery"
              {...dragging(setHeld)}
              style={styles.viewport}
            >
              <Slides prefix="gallery" />
            </CarouselViewport>
          </Carousel>
        </View>
      </ScrollView>
      <Carousel
        aria-label="Upright"
        onPageChange={setUpright}
        style={styles.carousel}
      >
        <CarouselViewport testID="cross" style={styles.viewport}>
          <Slides prefix="cross" />
        </CarouselViewport>
      </Carousel>
      <View style={styles.spacer} />
    </ScrollView>
  )
}

const dotStyle = (state: CarouselIndicatorState) => [
  styles.dot,
  state.selected && styles.selected,
]

const styles = StyleSheet.create({
  page: { flex: 1 },
  carousel: { width: 300, gap: 8, marginVertical: 8 },
  viewport: { height: 120 },
  item: { width: "100%" },
  tile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f4f5",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  step: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#d4d4d8" },
  selected: { backgroundColor: "#18181b" },
  sideways: { width: 300, flexGrow: 0 },
  wide: { width: 900, paddingStart: 200 },
  spacer: { height: 600 },
})

export { Fixture }

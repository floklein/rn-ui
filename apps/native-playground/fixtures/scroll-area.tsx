import {
  createScrollAreaController,
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaScrollToEnd,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@ui-sdk/react-native/scroll-area"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/react-native/slider"
import { useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

const rows = Array.from({ length: 40 }, (_, index) => `Row ${index + 1}`)

function Fixture() {
  const [controller] = useState(createScrollAreaController)
  const [edge, setEdge] = useState("at start")
  const [top, setTop] = useState(0)
  const [balance, setBalance] = useState(50)
  const [balanceKept, setBalanceKept] = useState(50)
  const [scrolled, setScrolled] = useState(0)
  const [level, setLevel] = useState(50)
  const [levelKept, setLevelKept] = useState(50)
  const [lifted, setLifted] = useState(0)
  return (
    <View style={styles.fixture}>
      <Text testID="list-readout">{`List ${edge}, top ${top}`}</Text>
      <Text testID="drag-readout">
        {`Balance ${balance} kept ${balanceKept}, scrolled ${scrolled}; level ${level} kept ${levelKept}, lifted ${lifted}`}
      </Text>
      <View style={styles.row}>
        <Pressable
          testID="to-start"
          accessibilityRole="button"
          onPress={() => controller.scrollToStart({ behavior: "instant" })}
          style={styles.button}
        >
          <Text>To Start</Text>
        </Pressable>
      </View>
      <ScrollArea type="always" controller={controller} style={styles.list}>
        <ScrollAreaViewport
          testID="list"
          aria-label="Rows"
          onScroll={(event) => {
            setTop(Math.round(event.nativeEvent.contentOffset.y))
            setEdge(
              controller.isAtEnd()
                ? "at end"
                : controller.isAtStart()
                  ? "at start"
                  : "between"
            )
          }}
        >
          <ScrollAreaContent>
            {rows.map((row) => (
              <Text key={row} style={styles.item}>
                {row}
              </Text>
            ))}
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar testID="list-scrollbar" style={styles.scrollbar}>
          <ScrollAreaThumb testID="list-thumb" style={styles.thumb} />
        </ScrollAreaScrollbar>
        <ScrollAreaScrollToEnd style={styles.toEnd}>
          <Text>Latest</Text>
        </ScrollAreaScrollToEnd>
      </ScrollArea>
      <ScrollArea style={styles.sideways}>
        <ScrollAreaViewport
          horizontal
          testID="sideways"
          onScroll={(event) =>
            setScrolled(Math.round(event.nativeEvent.contentOffset.x))
          }
        >
          <ScrollAreaContent style={styles.wide}>
            <Slider
              defaultValue={50}
              onValueChange={setBalance}
              onValueCommit={setBalanceKept}
              style={styles.slider}
            >
              <SliderControl testID="balance-control" style={styles.control}>
                <SliderTrack style={styles.track}>
                  <SliderIndicator style={styles.indicator} />
                  <SliderThumb
                    aria-label="Balance"
                    style={styles.sliderThumb}
                  />
                </SliderTrack>
              </SliderControl>
            </Slider>
          </ScrollAreaContent>
        </ScrollAreaViewport>
      </ScrollArea>
      <ScrollArea style={styles.upright}>
        <ScrollAreaViewport
          testID="upright"
          onScroll={(event) =>
            setLifted(Math.round(event.nativeEvent.contentOffset.y))
          }
        >
          <ScrollAreaContent style={styles.tall}>
            <Slider
              orientation="vertical"
              defaultValue={50}
              onValueChange={setLevel}
              onValueCommit={setLevelKept}
              style={styles.vertical}
            >
              <SliderControl testID="level-control" style={styles.column}>
                <SliderTrack style={styles.rail}>
                  <SliderIndicator style={styles.indicator} />
                  <SliderThumb aria-label="Level" style={styles.sliderThumb} />
                </SliderTrack>
              </SliderControl>
            </Slider>
          </ScrollAreaContent>
        </ScrollAreaViewport>
      </ScrollArea>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { gap: 12, padding: 16 },
  row: { flexDirection: "row", gap: 8 },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
  },
  list: {
    height: 200,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  item: { paddingHorizontal: 12, paddingVertical: 8 },
  scrollbar: { width: 24, padding: 4 },
  thumb: { width: 16, borderRadius: 8, backgroundColor: "#71717a" },
  toEnd: {
    position: "absolute",
    bottom: 8,
    end: 32,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e4e4e7",
  },
  sideways: { height: 80, borderWidth: 1, borderColor: "#d4d4d8" },
  wide: { width: 900, justifyContent: "center", paddingHorizontal: 16 },
  slider: { width: 300 },
  control: { height: 44, justifyContent: "center" },
  track: { height: 2, backgroundColor: "#d4d4d8" },
  indicator: { backgroundColor: "#18181b" },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#18181b",
    backgroundColor: "#ffffff",
  },
  upright: { height: 220, borderWidth: 1, borderColor: "#d4d4d8" },
  tall: { height: 700, paddingVertical: 16, paddingHorizontal: 24 },
  vertical: { height: 180 },
  column: { width: 44, height: 180, alignItems: "center" },
  rail: { width: 2, height: "100%", backgroundColor: "#d4d4d8" },
})

export { Fixture }

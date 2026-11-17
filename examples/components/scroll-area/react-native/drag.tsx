import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
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
import { StyleSheet, Text, View } from "react-native"

const channels = ["Vocals", "Guitar", "Bass", "Keys", "Drums", "Strings"]

function Example() {
  return (
    <ScrollArea style={styles.area}>
      <ScrollAreaViewport horizontal aria-label="Mixer">
        <ScrollAreaContent style={styles.content}>
          {channels.map((channel) => (
            <View key={channel} style={styles.channel}>
              <Text style={styles.name}>{channel}</Text>
              <Slider defaultValue={50} style={styles.slider}>
                <SliderControl style={styles.control}>
                  <SliderTrack style={styles.track}>
                    <SliderIndicator style={styles.indicator} />
                    <SliderThumb aria-label={channel} style={styles.thumb} />
                  </SliderTrack>
                </SliderControl>
              </Slider>
            </View>
          ))}
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="horizontal" style={styles.scrollbar}>
        <ScrollAreaThumb style={styles.scrollThumb} />
      </ScrollAreaScrollbar>
    </ScrollArea>
  )
}

const styles = StyleSheet.create({
  area: {
    width: 300,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    overflow: "hidden",
  },
  content: { flexDirection: "row", gap: 16, padding: 16, paddingBottom: 20 },
  channel: { width: 160, gap: 4 },
  name: { fontSize: 14 },
  slider: { width: "100%" },
  control: { height: 44, justifyContent: "center" },
  track: { height: 2, borderRadius: 999, backgroundColor: "#d4d4d8" },
  indicator: { borderRadius: 999, backgroundColor: "#18181b" },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#18181b",
    backgroundColor: "#ffffff",
  },
  scrollbar: { height: 10, padding: 2 },
  scrollThumb: { height: 6, borderRadius: 3, backgroundColor: "#a1a1aa" },
})

export { Example }

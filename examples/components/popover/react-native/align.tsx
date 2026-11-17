import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { StyleSheet, Text, View } from "react-native"

const aligns = [
  { value: "start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "end", label: "End" },
] as const

function Example() {
  return (
    <View style={styles.row}>
      {aligns.map((align) => (
        <Popover key={align.value}>
          <PopoverTrigger style={styles.button}>
            <Text>{align.label}</Text>
          </PopoverTrigger>
          <PopoverContent
            align={align.value}
            sideOffset={8}
            style={styles.content}
          >
            <PopoverTitle style={styles.title}>Delivery window</PopoverTitle>
            <PopoverDescription style={styles.description}>
              Arrives Tuesday between 9 AM and noon.
            </PopoverDescription>
          </PopoverContent>
        </Popover>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  content: {
    width: 240,
    gap: 6,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  description: { fontSize: 14, color: "#71717a" },
})

export { Example }

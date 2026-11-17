import { Switch, SwitchThumb } from "@ui-sdk/react-native/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@ui-sdk/react-native/tooltip"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()
  const [open, setOpen] = useState(false)
  return (
    <View style={styles.stack}>
      <View style={styles.option}>
        <Switch
          aria-label="Open"
          checked={open}
          onCheckedChange={setOpen}
          style={(state) => [styles.switch, state.checked && styles.checked]}
        >
          <SwitchThumb
            style={(state) => [styles.thumb, state.checked && styles.thumbOn]}
          />
        </Switch>
        <Text>Open</Text>
      </View>
      <Tooltip
        open={open}
        onOpenChange={(next, details) => {
          setOpen(next)
          log(`${next ? "Opened" : "Closed"} (${details.reason})`)
        }}
      >
        <TooltipTrigger style={styles.button}>
          <Text>Export</Text>
        </TooltipTrigger>
        <TooltipContent style={styles.content}>
          <Text style={styles.text}>Download as CSV</Text>
        </TooltipContent>
      </Tooltip>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  option: { flexDirection: "row", alignItems: "center", gap: 8 },
  switch: {
    width: 44,
    height: 26,
    padding: 3,
    borderRadius: 13,
    backgroundColor: "#d4d4d8",
  },
  checked: { backgroundColor: "#18181b" },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  thumbOn: { transform: [{ translateX: 18 }] },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  content: {
    maxWidth: 240,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#18181b",
  },
  text: { fontSize: 13, color: "#fafafa" },
})

export { Example }

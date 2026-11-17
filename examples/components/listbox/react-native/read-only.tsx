import {
  Listbox,
  ListboxItem,
  ListboxItemIndicator,
  type ListboxItemState,
} from "@ui-sdk/react-native/listbox"
import { StyleSheet, Text, View } from "react-native"

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "nuxt", label: "Nuxt" },
  { value: "sveltekit", label: "SvelteKit" },
]

function Example() {
  return (
    <Listbox
      readOnly
      defaultValue="nuxt"
      aria-label="Framework"
      style={styles.list}
    >
      {frameworks.map((framework) => (
        <ListboxItem
          key={framework.value}
          value={framework.value}
          style={itemStyle}
        >
          <Text style={styles.itemText}>{framework.label}</Text>
          <ListboxItemIndicator>
            <View style={styles.check} />
          </ListboxItemIndicator>
        </ListboxItem>
      ))}
    </Listbox>
  )
}

const itemStyle = (
  state: ListboxItemState,
  { pressed }: { pressed: boolean }
) => [
  styles.item,
  (state.highlighted || pressed) && styles.highlighted,
  state.selected && styles.selected,
  state.disabled && styles.disabled,
]

const styles = StyleSheet.create({
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    marginRight: 4,
    borderColor: "#18181b",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
  disabled: { opacity: 0.4 },
  highlighted: { backgroundColor: "#f4f4f5" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemText: { fontSize: 16 },
  list: {
    width: 260,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  selected: { backgroundColor: "#e4e4e7" },
})

export { Example }

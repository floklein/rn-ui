import { Radio, RadioGroup } from "@ui-sdk/react-native/radio"
import { Pressable, StyleSheet, Text, View } from "react-native"

const options = [
  {
    value: "all",
    label: "Everything",
    description: "Every message and update.",
  },
  {
    value: "mentions",
    label: "Mentions",
    description: "Only when someone mentions you.",
  },
  { value: "none", label: "Nothing", description: "Turn notifications off." },
]

function Example() {
  return (
    <View style={styles.stack}>
      <Text style={styles.heading}>Notify me about</Text>
      <RadioGroup
        aria-label="Notify me about"
        defaultValue="mentions"
        style={styles.stack}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            value={option.value}
            aria-label={option.label}
            aria-description={option.description}
            render={(props, state) => (
              <Pressable
                {...props}
                style={[styles.option, state.checked && styles.optionChecked]}
              >
                <View style={styles.text}>
                  <Text style={styles.label}>{option.label}</Text>
                  <Text style={styles.hint}>{option.description}</Text>
                </View>
                {state.checked && <View style={styles.check} />}
              </Pressable>
            )}
          />
        ))}
      </RadioGroup>
    </View>
  )
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  heading: { fontSize: 17, fontWeight: "600" },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  optionChecked: { borderColor: "#16a34a" },
  text: { flex: 1, gap: 4 },
  label: { fontSize: 16 },
  hint: { fontSize: 14, color: "#71717a" },
  check: {
    width: 6,
    height: 11,
    marginTop: -2,
    borderColor: "#16a34a",
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: "45deg" }],
  },
})

export { Example }

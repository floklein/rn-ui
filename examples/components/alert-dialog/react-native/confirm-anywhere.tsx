import { confirm } from "@ui-sdk/react-native/alert-dialog"
import { Pressable, StyleSheet, Text } from "react-native"
import { useLog } from "../../../shared/react/log"

function Example() {
  const log = useLog()

  async function archive() {
    const yes = await confirm({
      title: "Archive this project?",
      description: "It moves to Archived, and you can restore it anytime.",
      confirmLabel: "Archive",
    })
    log(yes ? "Archived the project" : "Kept the project")
  }

  return (
    <Pressable role="button" onPress={archive} style={styles.button}>
      <Text>Archive Project</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
})

export { Example }

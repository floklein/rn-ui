import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ui-sdk/react-native/avatar"
import { StyleSheet, Text } from "react-native"

const person = {
  name: "shadcn",
  src: "https://github.com/shadcn.png",
}

function Example() {
  return (
    <Avatar style={styles.avatar}>
      <AvatarImage
        source={{ uri: person.src }}
        alt={person.name}
        style={styles.image}
      />
      <AvatarFallback accessible aria-label={person.name} style={styles.image}>
        <Text style={styles.initials}>CN</Text>
      </AvatarFallback>
    </Avatar>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#f4f4f5",
  },
  image: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 14, fontWeight: "500", color: "#3f3f46" },
})

export { Example }

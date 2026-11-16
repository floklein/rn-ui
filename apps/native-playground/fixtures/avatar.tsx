import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  type AvatarLoadingStatus,
  type AvatarState,
} from "@ui-sdk/react-native/avatar"
import { useState, type ReactNode } from "react"
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native"

const ada = {
  uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAACqklEQVR42u2Yu2tUQRSH7z+itShYCBYRMRaSFIKPIj4qMQppVhexEVIYVHwEExGCWUHYCCEhUVZB4osEERITsDFLwJBoYZcqRCzsxA8GhiXujffOmdwzCwO/YnfnnDO/b+7c2ZlJPqz+aWklESACRIAIEAEiQATYpPH3S9dvDPacv3DuVBfiA1/5sQUAHjyePH64rX33jqaiiYBAARjg00c706w3ijCPTyPx5b5z/54s7o0I9sWQFO/eL4MU4M2XDQf3loF0ZYBy6YqbeyPSNQGqLz5J3BtRRA1AOPxeHkIimf3WRNehvbMjt3KJFJsueRPcAYZH31oHGPo5P5ZLpNh0SikAsDsw3ZdOtud1b0SiqUApBQA2Oab72v2rbgAkmgqU0gRwc2+kD+A8fxpnkSbAQPmsBIB0NQB2+fRdudYtASCdIpRSW4W8AOisQuwlfQFItqWirQQnLPk7QBG1vRCPXr4KSeaPFMAcBiQA8iOB9DxwZ/DJu0e9bu5JJF3/SDl077YbAIlBnImZA98+1vK6J0V+nvR2KzG3/Gt94Xl29wSTEta9UH3pe3YAgkO8mcvI4NG9/6vFha/ra59fp1mniYDQL3eXF+tpADS1wO10BIgAESACaAE8m9+4Wa2/nJhKA6CJAMLCAng6s3axb2bfscrOA/3obl8lDYAmE0MwKSQqAzCcB8+MGE9Wl8pD06PVpqJpUzDpFFEAGH71ww65XJSiYEEAU4u/T5Rqvqw3irIU314AZq3HgW/6KPK+GEku97uOPNw+90Z0kYshCcq9A0OScYEvzL1lyPh3kQng37WyANGpH4DL/bPFuzeiaylA8ZMn70T6DwB/+FrujTAgAlAcfvsQ3AEGJlZ03RthwxFAff5kmUVbAXR0j4cAgA1HgBDcG21h8i9D6D5a5WfrvgAAAABJRU5ErkJggg==",
}
const hedy = {
  uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAACqklEQVR42u2YwUtUURSH39/QJgqJZtGkQmGlILkwBhljqHBRUEEkGkIxgsHsXCS6E4UWtig3UiAE2iIXkSs3s3MR1CIRXElEG2nVKuiLG89B59l791zfuQMXfgudd855v+++8+6790a/v822tKIAEAACQAAIAAEgABzQ543a3NTQyL2+2ze6EX/wLz+2AMDblw97r5xrO3WyqbhEgKcADHC5/0KS9UYR5vBpRK7cdxbPpHFvRLArhih/924ZpAB7WzMW7mMG0pUBJsZKdu6NSNcEqK+NS9wbUUQNQDj8Th5CJOn+/W4utD2tXM4kUuJ0yZtgD/BheSx2gKH5+32ZREqcTikFAFYH/76vHWezujci0VSglAIAixxz+9HSRTsAEk0FSmkC2Lk30gew7p/GLtIEuNlzXgJAuhoAq/y/977aIQEgnSKUUpuFnADozEKsJV0BSJaloqUEOyz5O0ARtbUQj14+C0n6RwpgNgMSAPmWQLofWJy7+6TcZeeeRNL1t5TPHg/YAZDoxZ6YHlicuJ7VPSny/aSzU4m9L1MLo9fSuyeYFM/Ohd5X0wMQ7OPJXEoGh+7dHy1+35x8XaskWecSAb4f7taXRpIAuNQCp9MBIAAEgACgBfDz0+TXNw9WaolrOy4RQJhfAD/qtfp0eblSeNV9Ai0MFhOXQINFE0MwKSQqAzCcq3fajadYL0qF50OXmopLB4JJp4gCwO56NR5yuShFwZwAfm1Pf6z2urLeKMpS/HgB6FqHA9/0UWR9MaJM7pf6Tx+feyNukYkh8sq9BUOUcoLPzX3MkPJzkQrg8FyZg7ipG4DN+Vv5uzfi1lKA/JsnayP9B4APvpZ7IwyIABSHP34I9gA77x7pujfChiWAev+k6aKjANaGu3wAwIYlgA/ujY4w+QdlmgOMzzUtTQAAAABJRU5ErkJggg==",
}
const broken = { uri: "data:image/png;base64,AAAA" }

function Person({
  id,
  name,
  initials,
  source,
  delay,
  children,
}: {
  id: string
  name: string
  initials: string
  source?: ImageSourcePropType
  delay?: number
  children?: ReactNode
}) {
  const [status, setStatus] = useState<AvatarLoadingStatus>("idle")
  return (
    <View style={styles.row}>
      <Avatar
        testID={`avatar-${id}`}
        onLoadingStatusChange={setStatus}
        style={styles.avatar}
      >
        {children ?? (
          <AvatarImage
            testID={`image-${id}`}
            source={source}
            alt={name}
            style={styles.image}
          />
        )}
        <AvatarFallback
          delay={delay}
          testID={`fallback-${id}`}
          style={styles.image}
        >
          <Text testID={`initials-${id}`}>{initials}</Text>
        </AvatarFallback>
      </Avatar>
      <Text testID={`status-${id}`}>{status}</Text>
    </View>
  )
}

function Action({
  label,
  testID,
  onPress,
}: {
  label: string
  testID: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={styles.action}
    >
      <Text>{label}</Text>
    </Pressable>
  )
}

const frame = (state: AvatarState) => [
  styles.image,
  state.loadingStatus === "loaded" && styles.loaded,
]

function Fixture() {
  const [changed, setChanged] = useState(false)
  const [removed, setRemoved] = useState(false)
  return (
    <View style={styles.fixture}>
      <Person id="ada" name="Ada Lovelace" initials="AL">
        {!removed && (
          <AvatarImage
            testID="image-ada"
            source={changed ? hedy : ada}
            alt="Ada Lovelace"
            style={frame}
          />
        )}
      </Person>
      <Person id="grace" name="Grace Hopper" initials="GH" source={broken} />
      <Person id="alan" name="Alan Turing" initials="AT" />
      <Person
        id="hedy"
        name="Hedy Lamarr"
        initials="HL"
        source={broken}
        delay={600}
      />
      <View style={styles.actions}>
        <Action
          label="Change image"
          testID="change-image"
          onPress={() => setChanged(true)}
        />
        <Action
          label="Remove image"
          testID="remove-image"
          onPress={() => setRemoved(true)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fixture: { alignSelf: "stretch", paddingHorizontal: 16, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
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
  loaded: { borderRadius: 20 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  action: { padding: 8, borderRadius: 6, backgroundColor: "#f4f4f5" },
})

export { Fixture }

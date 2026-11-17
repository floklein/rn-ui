import {
  createPopoverController,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@ui-sdk/react-native/popover"
import { useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useLog } from "../../../shared/react/log"

type Member = { name: string; role: string }

const roles = ["Admin", "Editor", "Viewer"]

function Example() {
  const log = useLog()
  const [popover] = useState(() => createPopoverController<Member>())
  const [members, setMembers] = useState<Member[]>([
    { name: "Hollis Grant", role: "Owner" },
    { name: "Inès Moreau", role: "Editor" },
    { name: "Kofi Mensah", role: "Viewer" },
    { name: "Wren Takahashi", role: "Viewer" },
  ])
  const setRole = (member: Member, role: string) =>
    setMembers((current) =>
      current.map((entry) =>
        entry.name === member.name ? { ...entry, role } : entry
      )
    )
  return (
    <View style={styles.list}>
      {members.map((member) => (
        <View key={member.name} style={styles.row}>
          <View style={styles.person}>
            <Text>{member.name}</Text>
            <Text style={styles.hint}>{member.role}</Text>
          </View>
          <PopoverTrigger
            controller={popover}
            payload={member}
            disabled={member.role === "Owner"}
            aria-label={`Edit ${member.name}`}
            style={styles.button}
          >
            <Text>Edit</Text>
          </PopoverTrigger>
        </View>
      ))}
      <Popover
        controller={popover}
        onPayloadChange={(payload) => {
          const member = payload as Member | undefined
          if (member) {
            log(`Editing ${member.name}`)
          }
        }}
      >
        <PopoverContent align="end" sideOffset={8} style={styles.content}>
          {(state) => {
            const member = state.payload as Member | undefined
            return (
              <>
                <PopoverTitle style={styles.title}>{member?.name}</PopoverTitle>
                <PopoverDescription style={styles.hint}>
                  Roles decide what they can change.
                </PopoverDescription>
                <View style={styles.roles}>
                  {roles.map((role) => (
                    <PopoverClose
                      key={role}
                      onPress={() => member && setRole(member, role)}
                      style={[
                        styles.button,
                        member?.role === role && styles.current,
                      ]}
                    >
                      <Text>{role}</Text>
                    </PopoverClose>
                  ))}
                </View>
              </>
            )
          }}
        </PopoverContent>
      </Popover>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { alignSelf: "stretch", gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  person: { flex: 1 },
  hint: { fontSize: 14, color: "#71717a" },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#d4d4d8",
  },
  current: { backgroundColor: "#e4e4e7" },
  content: {
    width: 260,
    gap: 8,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    borderColor: "#e4e4e7",
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 15, fontWeight: "600" },
  roles: { flexDirection: "row", gap: 6 },
})

export { Example }

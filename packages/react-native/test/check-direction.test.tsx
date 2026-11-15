import { act, render, screen } from "@testing-library/react-native"
import { useState } from "react"
import { Platform, Text, View } from "react-native"
import { Button } from "../src/button"
import { Switch, SwitchThumb } from "../src/switch"
import { checkDirection } from "../src/testing"

const os = Platform.OS === "android" ? "android" : "ios"

// A slider written by hand whose increment action follows the screen's side, the fault the check exists for.
function SideSlider({ direction }: { direction: "ltr" | "rtl" }) {
  const [value, setValue] = useState(5)
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Volume"
      accessibilityValue={{ min: 0, max: 10, now: value }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === "increment" ? 1 : -1
        setValue(value + (direction === "rtl" ? -step : step))
      }}
    />
  )
}

describe("checkDirection on the native host", () => {
  test("passes on a switch, which acts the same in both directions", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Switch aria-label="Wi-Fi">
              <SwitchThumb />
            </Switch>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a button", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Button>
              <Text>Save</Text>
            </Button>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("fails when an action does something else right to left", async () => {
    await expect(
      checkDirection(
        async (direction) => {
          await render(<SideSlider direction={direction} />)
          return screen.container
        },
        { os, act }
      )
    ).rejects.toThrow(
      'after the increment action on the adjustable "Volume", right to left leaves'
    )
  })
})

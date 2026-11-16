import { act, render, screen } from "@testing-library/react-native"
import { createSwitchController } from "@ui-sdk/core/switch"
import { build } from "esbuild"
import path from "node:path"
import { useState } from "react"
import { Platform, Pressable, Text, View } from "react-native"
import { Button } from "../src/button"
import { Switch, SwitchThumb } from "../src/switch"
import { checkPattern } from "../src/testing"
import { Toggle, ToggleGroup } from "../src/toggle"

const os = Platform.OS === "android" ? "android" : "ios"
const check = () => checkPattern(screen.container, "switch", { os, act })
const checkButton = () => checkPattern(screen.container, "button", { os, act })

// A disclosure written by hand, whose actions focus a switch through its controller when `requests` is set.
function Disclosure({
  requests,
  onAction,
}: {
  requests: boolean
  onAction: (action: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [controller] = useState(() => createSwitchController())
  const toggle = (next: boolean) => {
    setExpanded(next)
    if (requests) {
      controller.focus()
    }
  }
  return (
    <View>
      <Switch aria-label="Wi-Fi" controller={controller}>
        <SwitchThumb />
      </Switch>
      {expanded ? null : (
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Details"
          accessibilityState={{ expanded }}
          accessibilityActions={[{ name: "expand" }, { name: "collapse" }]}
          onAccessibilityAction={(event) => {
            onAction(event.nativeEvent.actionName)
            toggle(event.nativeEvent.actionName === "expand")
          }}
          onAccessibilityEscape={() => {
            onAction("escape")
            toggle(true)
          }}
        />
      )}
      {expanded ? (
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Details"
          accessibilityState={{ expanded }}
          accessibilityActions={[{ name: "collapse" }]}
          onAccessibilityAction={(event) => {
            onAction(event.nativeEvent.actionName)
            toggle(false)
          }}
        />
      ) : null}
    </View>
  )
}

describe("checkPattern on the native host", () => {
  test("passes on a switch", async () => {
    await render(
      <Switch aria-label="Wi-Fi">
        <SwitchThumb />
      </Switch>
    )
    await expect(check()).resolves.toBeUndefined()
  })

  test("fails on a switch with no name", async () => {
    await render(
      <Switch>
        <SwitchThumb />
      </Switch>
    )
    await expect(check()).rejects.toThrow("the switch has no name")
  })

  test("fails on a switch with the wrong role", async () => {
    await render(
      <Switch
        aria-label="Wi-Fi"
        render={(props) => (
          <Pressable {...props} accessibilityRole="checkbox" />
        )}
      >
        <SwitchThumb />
      </Switch>
    )
    await expect(check()).rejects.toThrow("has no element with the switch role")
  })

  test("fails on a switch whose state doesn't change after the activate action", async () => {
    await render(
      <Switch checked={false} aria-label="Wi-Fi">
        <SwitchThumb />
      </Switch>
    )
    await expect(check()).rejects.toThrow(
      'the switch "Wi-Fi" stays false after the activate action'
    )
  })

  test("fails on content hidden from the other OS's screen reader only", async () => {
    await render(
      <View>
        <Switch aria-label="Wi-Fi">
          <SwitchThumb />
        </Switch>
        <View
          accessibilityElementsHidden={os === "android"}
          importantForAccessibility={
            os === "ios" ? "no-hide-descendants" : undefined
          }
        />
      </View>
    )
    await expect(check()).rejects.toThrow(
      `is hidden on ${os === "ios" ? "android" : "ios"} only`
    )
  })

  test("fails on an accessible element inside another", async () => {
    await render(
      <Switch aria-label="Wi-Fi">
        <SwitchThumb accessible />
      </Switch>
    )
    await expect(check()).rejects.toThrow(
      'is an accessible element inside the switch "Wi-Fi"'
    )
  })

  test("performs escape on iOS only, and expand and collapse on Android only", async () => {
    const onAction = jest.fn()
    await render(<Disclosure requests onAction={onAction} />)
    await expect(check()).resolves.toBeUndefined()
    const performed = onAction.mock.calls.map(([action]) => action)
    expect(performed).toEqual(
      os === "ios" ? ["escape"] : ["expand", "collapse"]
    )
  })

  test("fails when opening or closing requests no accessibility focus", async () => {
    await render(<Disclosure requests={false} onAction={() => {}} />)
    await expect(check()).rejects.toThrow(
      `requests no accessibility focus after the ${os === "ios" ? "escape" : "expand"} action`
    )
  })

  test("its module imports no renderer", async () => {
    const result = await build({
      entryPoints: [path.join(__dirname, "../src/testing.ts")],
      bundle: true,
      write: false,
      metafile: true,
      platform: "neutral",
      logLevel: "silent",
      packages: "external",
    })
    const imported = Object.values(result.metafile.inputs).flatMap((input) =>
      input.imports.map((entry) => entry.path)
    )
    expect(
      imported.filter((name) =>
        /react-native|test-renderer|testing-library|^react/.test(name)
      )
    ).toEqual([])
  })
})

describe("checkPattern's button pattern on the native host", () => {
  test("passes on a button, and activates it", async () => {
    const onPress = jest.fn()
    await render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>
    )
    await expect(checkButton()).resolves.toBeUndefined()
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test("passes on a pending button, which ignores the activation", async () => {
    const onPress = jest.fn(() => new Promise(() => {}))
    await render(
      <Button onPress={onPress}>
        <Text>Save</Text>
      </Button>
    )
    await checkButton()
    await expect(checkButton()).resolves.toBeUndefined()
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  test("fails on a button with no name", async () => {
    await render(<Button aria-label="" />)
    await expect(checkButton()).rejects.toThrow("the button has no name")
  })

  test("fails on a button with the wrong role", async () => {
    await render(
      <Button
        aria-label="Save"
        render={(props) => <Pressable {...props} accessibilityRole="link" />}
      />
    )
    await expect(checkButton()).rejects.toThrow(
      "has no element with the button role"
    )
  })
})

describe("checkPattern's button pattern on toggle buttons", () => {
  test("passes on a toggle, whose activation presses and unpresses it", async () => {
    const onPressedChange = jest.fn()
    await render(
      <Toggle onPressedChange={onPressedChange}>
        <Text>Bookmark</Text>
      </Toggle>
    )
    await expect(checkButton()).resolves.toBeUndefined()
    expect(onPressedChange.mock.calls.map(([pressed]) => pressed)).toEqual([
      true,
      false,
    ])
  })

  test("passes on a toggle group, each toggle its own accessible element", async () => {
    await render(
      <ToggleGroup multiple aria-label="Text formatting">
        <Toggle value="bold" aria-label="Bold" />
        <Toggle value="italic" aria-label="Italic" disabled />
      </ToggleGroup>
    )
    await expect(checkButton()).resolves.toBeUndefined()
  })

  test("fails on a toggle with no name", async () => {
    await render(<Toggle />)
    await expect(checkButton()).rejects.toThrow(
      "the togglebutton has no name"
    )
  })

  test("fails on a toggle whose pressed state doesn't change after the activate action", async () => {
    await render(<Toggle pressed={false} aria-label="Bookmark" />)
    await expect(checkButton()).rejects.toThrow(
      'the togglebutton "Bookmark" stays false after the activate action'
    )
  })

  test("fails on a toggle button with no pressed state", async () => {
    await render(
      <Pressable accessibilityRole="togglebutton" accessibilityLabel="Bold" />
    )
    await expect(checkButton()).rejects.toThrow(
      "has no pressed state; a toggle button's checked state is true or false"
    )
  })
})

import { act, render, screen } from "@testing-library/react-native"
import { useState } from "react"
import { Platform, Text, View } from "react-native"
import { Avatar, AvatarFallback, AvatarImage } from "../src/avatar"
import { Button } from "../src/button"
import { Checkbox, CheckboxIndicator } from "../src/checkbox"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../src/collapsible"
import { Input, InputClear, InputGroup } from "../src/input"
import { Label } from "../src/label"
import { Meter, MeterIndicator, MeterLabel, MeterTrack } from "../src/meter"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "../src/progress"
import { OTPInput, OTPInputGroup, OTPInputSlot } from "../src/otp-input"
import {
  Pagination,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../src/pagination"
import {
  PasswordInput,
  PasswordInputControl,
  PasswordInputToggle,
} from "../src/password-input"
import { Radio, RadioGroup, RadioIndicator } from "../src/radio"
import { Rating } from "../src/rating"
import { Separator } from "../src/separator"
import { Switch, SwitchThumb } from "../src/switch"
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "../src/tabs"
import { checkDirection } from "../src/testing"
import { Toggle, ToggleGroup } from "../src/toggle"

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

  test("passes on a switch a label names", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <View>
              <Label htmlFor="wifi">Wi-Fi</Label>
              <Switch id="wifi">
                <SwitchThumb />
              </Switch>
            </View>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on an avatar", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Avatar>
              <AvatarImage
                source={{ uri: "https://example.com/ada.png" }}
                alt="Ada Lovelace"
              />
              <AvatarFallback>
                <Text>AL</Text>
              </AvatarFallback>
            </Avatar>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a pagination", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Pagination aria-label="Pagination" pageCount={3}>
              <PaginationPrevious aria-label="Previous" />
              <PaginationLink page={1} />
              <PaginationLink page={2} />
              <PaginationNext aria-label="Next" />
            </Pagination>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a progress bar and a meter", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <View>
              <Progress value={56}>
                <ProgressLabel>Uploading</ProgressLabel>
                <ProgressValue />
                <ProgressTrack>
                  <ProgressIndicator />
                </ProgressTrack>
              </Progress>
              <Meter value={40}>
                <MeterLabel>Storage</MeterLabel>
                <MeterTrack>
                  <MeterIndicator />
                </MeterTrack>
              </Meter>
            </View>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on separators between text", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <View>
              <Text>Profile</Text>
              <Separator orientation="vertical" />
              <Text>Billing</Text>
              <Separator decorative />
            </View>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a checkbox", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Checkbox aria-label="Accept">
              <CheckboxIndicator />
            </Checkbox>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a radio group", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <RadioGroup aria-label="Size" defaultValue="small">
              <Radio value="small" aria-label="Small">
                <RadioIndicator />
              </Radio>
              <Radio value="large" aria-label="Large">
                <RadioIndicator />
              </Radio>
            </RadioGroup>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a rating, and on a read-only one", async () => {
    for (const readOnly of [false, true]) {
      await expect(
        checkDirection(
          async () => {
            await render(
              <Rating aria-label="Rating" readOnly={readOnly} step={0.5} />
            )
            return screen.container
          },
          { os, act }
        )
      ).resolves.toBeUndefined()
    }
  })

  test("passes on a toggle group", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <ToggleGroup multiple aria-label="Text formatting">
              <Toggle value="bold" aria-label="Bold" />
              <Toggle value="italic" aria-label="Italic" />
            </ToggleGroup>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on tabs", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Tabs defaultValue="profile">
              <TabsList aria-label="Account">
                <TabsTab value="profile">
                  <Text>Profile</Text>
                </TabsTab>
                <TabsTab value="billing">
                  <Text>Billing</Text>
                </TabsTab>
                <TabsIndicator />
              </TabsList>
              <TabsPanel value="profile">
                <Text>Profile panel</Text>
              </TabsPanel>
            </Tabs>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a collapsible", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Collapsible defaultOpen>
              <CollapsibleTrigger>
                <Text>Order #4189</Text>
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <Text>Linen shirt</Text>
              </CollapsiblePanel>
            </Collapsible>
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

  test("passes on an input in a group with a clear button", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <InputGroup>
              <Input aria-label="Search" defaultValue="Lisbon" />
              <InputClear aria-label="Clear search" />
            </InputGroup>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on an otp input", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <OTPInput aria-label="Code" maxLength={4} defaultValue="12">
              <OTPInputGroup>
                <OTPInputSlot index={0} />
                <OTPInputSlot index={1} />
                <OTPInputSlot index={2} />
                <OTPInputSlot index={3} />
              </OTPInputGroup>
            </OTPInput>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a password input with its toggle", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <PasswordInput defaultValue="hunter2">
              <PasswordInputControl aria-label="Password" />
              <PasswordInputToggle aria-label="Show password" />
            </PasswordInput>
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

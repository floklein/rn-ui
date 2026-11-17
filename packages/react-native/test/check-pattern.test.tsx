import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { createSwitchController } from "@ui-sdk/core/switch"
import { build } from "esbuild"
import path from "node:path"
import { useState } from "react"
import { Modal, Platform, Pressable, Text, TextInput, View } from "react-native"
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "../src/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "../src/avatar"
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../src/alert-dialog"
import { Button } from "../src/button"
import { Checkbox, CheckboxGroup, CheckboxIndicator } from "../src/checkbox"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../src/collapsible"
import { Field, FieldLabel } from "../src/field"
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog"
import { Input, InputClear, InputGroup } from "../src/input"
import { Label } from "../src/label"
import { Meter, MeterLabel, MeterValue } from "../src/meter"
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "../src/progress"
import {
  FileInput,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
} from "../src/file-input"
import {
  NumberInput,
  NumberInputControl,
  NumberInputDecrement,
  NumberInputGroup,
  NumberInputIncrement,
} from "../src/number-input"
import { OTPInput, OTPInputGroup, OTPInputSlot } from "../src/otp-input"
import { OverlayHost } from "../src/overlays"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../src/popover"
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationList,
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
import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
} from "../src/segmented-control"
import { Calendar } from "../src/calendar"
import {
  DatePicker,
  DatePickerClear,
  DatePickerContent,
  DatePickerInput,
  DatePickerTrigger,
} from "../src/date-picker"
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerTitle,
  DrawerTrigger,
} from "../src/drawer"
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaScrollToEnd,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "../src/scroll-area"
import { Separator } from "../src/separator"
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "../src/slider"
import { Switch, SwitchThumb } from "../src/switch"
import { Tabs, TabsList, TabsPanel, TabsTab } from "../src/tabs"
import { Textarea } from "../src/textarea"
import { checkPattern } from "../src/testing"
import {
  createToaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastRegion,
  ToastTitle,
} from "../src/toast"
import { Toggle, ToggleGroup } from "../src/toggle"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarInput,
  ToolbarLink,
  ToolbarSeparator,
} from "../src/toolbar"
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/tooltip"

const os = Platform.OS === "android" ? "android" : "ios"
const check = () => checkPattern(screen.container, "switch", { os, act })
const checkButton = () => checkPattern(screen.container, "button", { os, act })
const checkTextbox = () =>
  checkPattern(screen.container, "textbox", { os, act })
const checkCheckbox = () =>
  checkPattern(screen.container, "checkbox", { os, act })
const checkRadioGroup = () =>
  checkPattern(screen.container, "radio-group", { os, act })
const checkImage = () => checkPattern(screen.container, "img", { os, act })
const checkTabs = () => checkPattern(screen.container, "tabs", { os, act })
const checkScrollArea = () =>
  checkPattern(screen.container, "scroll-area", { os, act })
const checkSeparator = () =>
  checkPattern(screen.container, "separator", { os, act })
const checkCalendar = () =>
  checkPattern(screen.container, "calendar", { os, act })
const checkPagination = () =>
  checkPattern(screen.container, "pagination", { os, act })
const checkProgress = () =>
  checkPattern(screen.container, "progressbar", { os, act })
const checkMeter = () => checkPattern(screen.container, "meter", { os, act })
const checkToolbar = () =>
  checkPattern(screen.container, "toolbar", { os, act })
const checkDisclosure = () =>
  checkPattern(screen.container, "disclosure", { os, act })
const checkAccordion = () =>
  checkPattern(screen.container, "accordion", { os, act })

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

  test("fails when escape requests no accessibility focus, while expand and collapse needn't move it", async () => {
    await render(<Disclosure requests={false} onAction={() => {}} />)
    if (os === "ios") {
      await expect(check()).rejects.toThrow(
        "requests no accessibility focus after the escape action"
      )
    } else {
      await expect(check()).resolves.toBeUndefined()
    }
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

describe("checkPattern on controls a Label names", () => {
  test("passes on a switch, a checkbox and a text field, each named by its label", async () => {
    await render(
      <View>
        <Switch id="wifi">
          <SwitchThumb />
        </Switch>
        <Label htmlFor="wifi">Wi-Fi</Label>
        <Checkbox id="terms" />
        <Label htmlFor="terms">Accept the terms</Label>
        <Label htmlFor="city">City</Label>
        <Input id="city" />
      </View>
    )
    await act(() => new Promise((resolve) => setTimeout(resolve)))
    await expect(check()).resolves.toBeUndefined()
    await expect(checkCheckbox()).resolves.toBeUndefined()
    await expect(checkTextbox()).resolves.toBeUndefined()
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

describe("checkPattern's textbox pattern on the native host", () => {
  test("passes on an input in a group with a clear button, a disabled input and a textarea", async () => {
    await render(
      <View>
        <InputGroup>
          <Text>https://</Text>
          <Input aria-label="Website" defaultValue="example.com" />
          <InputClear aria-label="Clear website" />
        </InputGroup>
        <Input aria-label="Account" disabled />
        <Textarea aria-label="Notes" />
      </View>
    )
    await expect(checkTextbox()).resolves.toBeUndefined()
  })

  test("passes on an otp input, enabled, read-only or disabled, as one textbox with its slots hidden", async () => {
    const slots = (
      <OTPInputGroup>
        <OTPInputSlot index={0} />
        <OTPInputSlot index={1} />
        <OTPInputSlot index={2} />
      </OTPInputGroup>
    )
    await render(
      <View>
        <OTPInput aria-label="Code" maxLength={3} defaultValue="12">
          {slots}
        </OTPInput>
        <OTPInput aria-label="Read-only" maxLength={3} readOnly>
          {slots}
        </OTPInput>
        <OTPInput aria-label="Disabled" maxLength={3} disabled>
          {slots}
        </OTPInput>
      </View>
    )
    await expect(checkTextbox()).resolves.toBeUndefined()
  })

  test("passes on a password input, enabled, read-only or disabled, as a textbox and its toggle as a button", async () => {
    await render(
      <View>
        <PasswordInput defaultValue="hunter2">
          <PasswordInputControl aria-label="Password" />
          <PasswordInputToggle aria-label="Show password" />
        </PasswordInput>
        <PasswordInput readOnly>
          <PasswordInputControl aria-label="Read-only" />
          <PasswordInputToggle aria-label="Show read-only" />
        </PasswordInput>
        <PasswordInput disabled>
          <PasswordInputControl aria-label="Disabled" />
          <PasswordInputToggle aria-label="Show disabled" />
        </PasswordInput>
      </View>
    )
    await expect(checkTextbox()).resolves.toBeUndefined()
    await expect(checkButton()).resolves.toBeUndefined()
  })

  test("passes on a number input, enabled, read-only, disabled or at a bound, as a textbox and its step buttons as buttons", async () => {
    const parts = (name: string) => (
      <NumberInputGroup>
        <NumberInputDecrement aria-label={`Decrease ${name}`} />
        <NumberInputControl aria-label={name} />
        <NumberInputIncrement aria-label={`Increase ${name}`} />
      </NumberInputGroup>
    )
    await render(
      <View>
        <NumberInput defaultValue={3}>{parts("Amount")}</NumberInput>
        <NumberInput readOnly>{parts("Read-only")}</NumberInput>
        <NumberInput disabled>{parts("Disabled")}</NumberInput>
        <NumberInput defaultValue={10} max={10}>
          {parts("Full")}
        </NumberInput>
      </View>
    )
    await expect(checkTextbox()).resolves.toBeUndefined()
    await expect(checkButton()).resolves.toBeUndefined()
  })

  test("fails with no text field", async () => {
    await render(<Text>Website</Text>)
    await expect(checkTextbox()).rejects.toThrow("has no text field")
  })

  test("fails on a text field with no name", async () => {
    await render(<Input />)
    await expect(checkTextbox()).rejects.toThrow("the TextInput has no name")
  })

  test("fails on a text field inside an accessible element", async () => {
    await render(
      <View accessible accessibilityLabel="Website">
        <Input aria-label="Website" />
      </View>
    )
    await expect(checkTextbox()).rejects.toThrow(
      'the TextInput "Website" isn\'t an accessible element of its own'
    )
  })

  test("fails on a disabled text field that can still be edited", async () => {
    await render(
      <Input
        aria-label="Account"
        disabled
        render={(props) => <TextInput {...props} editable />}
      />
    )
    await expect(checkTextbox()).rejects.toThrow(
      "is disabled for the screen reader but can still be edited"
    )
  })
})

describe("checkPattern's img pattern on the native host", () => {
  const source = { uri: "https://example.com/ada.png" }
  const load = () =>
    fireEvent(
      screen.getByTestId("image", { includeHiddenElements: true }),
      "load"
    )

  test("passes on a loaded avatar, named by its alt", async () => {
    await render(
      <Avatar>
        <AvatarImage source={source} alt="Ada Lovelace" testID="image" />
        <AvatarFallback>
          <Text>AL</Text>
        </AvatarFallback>
      </Avatar>
    )
    await load()
    await expect(checkImage()).resolves.toBeUndefined()
  })

  test("passes on a loading avatar, read by its fallback", async () => {
    await render(
      <Avatar>
        <AvatarImage source={source} alt="Ada Lovelace" />
        <AvatarFallback>
          <Text>AL</Text>
        </AvatarFallback>
      </Avatar>
    )
    await expect(checkImage()).resolves.toBeUndefined()
  })

  test("fails on an image a screen reader reaches with no name", async () => {
    await render(<View accessible accessibilityRole="image" />)
    await expect(checkImage()).rejects.toThrow("the image has no name")
  })

  test("fails when a screen reader finds nothing to read", async () => {
    await render(
      <Avatar>
        <AvatarImage source={source} alt="Ada Lovelace" />
      </Avatar>
    )
    await expect(checkImage()).rejects.toThrow(
      "has no image and no text, so a screen reader reads nothing"
    )
  })
})

describe("checkPattern's checkbox pattern on the native host", () => {
  test("passes on a checkbox, and on a group with a mixed parent", async () => {
    await render(
      <Checkbox aria-label="Accept">
        <CheckboxIndicator />
      </Checkbox>
    )
    await expect(checkCheckbox()).resolves.toBeUndefined()
    await render(
      <CheckboxGroup defaultValue={["tea"]} allValues={["tea", "coffee"]}>
        <Checkbox aria-label="All" parent />
        <Checkbox aria-label="Tea" value="tea" />
        <Checkbox aria-label="Coffee" value="coffee" />
      </CheckboxGroup>
    )
    await expect(checkCheckbox()).resolves.toBeUndefined()
  })

  test("fails on a checkbox with no name", async () => {
    await render(<Checkbox />)
    await expect(checkCheckbox()).rejects.toThrow("the checkbox has no name")
  })

  test("fails on a checkbox whose state doesn't change after the activate action", async () => {
    await render(<Checkbox aria-label="Accept" checked={false} />)
    await expect(checkCheckbox()).rejects.toThrow(
      "stays false after the activate action"
    )
  })

  test("fails on a checkbox with the wrong role", async () => {
    await render(
      <Checkbox
        aria-label="Accept"
        render={(props) => <Pressable {...props} accessibilityRole="switch" />}
      />
    )
    await expect(checkCheckbox()).rejects.toThrow(
      "has no element with the checkbox role"
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
    await expect(checkButton()).rejects.toThrow("the togglebutton has no name")
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

describe("checkPattern's radio group pattern on the native host", () => {
  test("passes on a radio group, checked or not, disabled or with a disabled radio", async () => {
    for (const props of [{ defaultValue: "small" }, {}, { disabled: true }]) {
      await render(
        <RadioGroup aria-label="Size" {...props}>
          <Radio value="small" aria-label="Small">
            <RadioIndicator />
          </Radio>
          <Radio value="large" aria-label="Large" disabled>
            <RadioIndicator />
          </Radio>
          <Radio value="medium" aria-label="Medium">
            <RadioIndicator />
          </Radio>
        </RadioGroup>
      )
      await expect(checkRadioGroup()).resolves.toBeUndefined()
    }
  })

  test("passes on a segmented control, checked or not, disabled or with a disabled item", async () => {
    for (const props of [{ defaultValue: "list" }, {}, { disabled: true }]) {
      await render(
        <SegmentedControl aria-label="View" {...props}>
          <SegmentedControlIndicator />
          <SegmentedControlItem value="list">
            <Text>List</Text>
          </SegmentedControlItem>
          <SegmentedControlItem value="grid" disabled>
            <Text>Grid</Text>
          </SegmentedControlItem>
          <SegmentedControlItem value="board">
            <Text>Board</Text>
          </SegmentedControlItem>
        </SegmentedControl>
      )
      await expect(checkRadioGroup()).resolves.toBeUndefined()
    }
  })

  test("passes on a rating, and on one with half stars", async () => {
    const onValueChange = jest.fn()
    await render(
      <Rating
        aria-label="Rating"
        defaultValue={2}
        onValueChange={onValueChange}
      />
    )
    await expect(checkRadioGroup()).resolves.toBeUndefined()
    expect(onValueChange).toHaveBeenCalled()
    await render(<Rating aria-label="Rating" step={0.5} max={3} />)
    await expect(checkRadioGroup()).resolves.toBeUndefined()
  })

  test("passes on a disabled rating, which ignores the activation", async () => {
    await render(<Rating aria-label="Rating" disabled defaultValue={3} />)
    await expect(checkRadioGroup()).resolves.toBeUndefined()
  })

  test("fails with no radio", async () => {
    await render(<Rating readOnly defaultValue={3} />)
    await expect(checkRadioGroup()).rejects.toThrow(
      "has no element with the radio role, so it isn't a radio group"
    )
  })

  test("fails on a radio with no name or no checked state", async () => {
    await render(
      <View>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: false }}
        />
        <Pressable accessibilityRole="radio" accessibilityLabel="Small" />
      </View>
    )
    await expect(checkRadioGroup()).rejects.toThrow("the radio has no name")
    await expect(checkRadioGroup()).rejects.toThrow(
      'the radio "Small" has no checked state'
    )
  })

  test("fails on two checked radios", async () => {
    await render(
      <View>
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="Small"
          accessibilityState={{ checked: true }}
        />
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel="Large"
          accessibilityState={{ checked: true }}
        />
      </View>
    )
    await expect(checkRadioGroup()).rejects.toThrow(
      "has 2 checked radios; one is checked at most"
    )
  })

  test("fails on a radio that isn't the only one checked after the activate action", async () => {
    await render(<Rating aria-label="Rating" value={1} />)
    await expect(checkRadioGroup()).rejects.toThrow(
      'the radio "2 stars" isn\'t the only checked radio after the activate action'
    )
  })
})

describe("checkPattern's img pattern on a read-only rating", () => {
  test("passes on a read-only rating, one image named by its score", async () => {
    await render(<Rating readOnly defaultValue={4.2} />)
    await expect(checkImage()).resolves.toBeUndefined()
  })
})

const listRole = os === "ios" ? "tabbar" : "tablist"

// Tabs written by hand, whose selection follows `selected` and ignores presses when `stuck`.
function HandTabs({
  selected,
  stuck,
}: {
  selected: string[]
  stuck?: boolean
}) {
  const [value, setValue] = useState(selected)
  return (
    <View accessibilityRole={listRole}>
      {["Profile", "Billing"].map((name) => (
        <Pressable
          key={name}
          accessibilityRole="tab"
          accessibilityState={{ selected: value.includes(name) }}
          onPress={() => (stuck ? undefined : setValue([name]))}
        >
          <Text>{name}</Text>
        </Pressable>
      ))}
    </View>
  )
}

describe("checkPattern's tabs pattern on the native host", () => {
  test("passes on tabs, selecting each enabled tab that isn't selected", async () => {
    const onValueChange = jest.fn()
    await render(
      <Tabs defaultValue="profile" onValueChange={onValueChange}>
        <TabsList aria-label="Account">
          <TabsTab value="profile">
            <Text>Profile</Text>
          </TabsTab>
          <TabsTab value="billing">
            <Text>Billing</Text>
          </TabsTab>
          <TabsTab value="team" disabled>
            <Text>Team</Text>
          </TabsTab>
        </TabsList>
        <TabsPanel value="profile">
          <Text>Profile panel</Text>
        </TabsPanel>
        <TabsPanel value="billing">
          <Text>Billing panel</Text>
        </TabsPanel>
      </Tabs>
    )
    await expect(checkTabs()).resolves.toBeUndefined()
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      "billing",
    ])
  })

  test("fails on tabs with no tab list", async () => {
    await render(
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
      >
        <Text>Profile</Text>
      </Pressable>
    )
    await expect(checkTabs()).rejects.toThrow(
      `has no element with the ${listRole} role`
    )
  })

  test("fails on a tab list with the other OS's role, which its screen reader doesn't hear", async () => {
    await render(
      <View accessibilityRole={os === "ios" ? "tablist" : "tabbar"}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
        >
          <Text>Profile</Text>
        </Pressable>
      </View>
    )
    await expect(checkTabs()).rejects.toThrow(
      `has no element with the ${listRole} role`
    )
  })

  test("fails on a tab with no name", async () => {
    await render(
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTab value="profile" />
        </TabsList>
      </Tabs>
    )
    await expect(checkTabs()).rejects.toThrow("the tab has no name")
  })

  test("fails on a tab a screen reader can't reach", async () => {
    await render(
      <View accessible accessibilityLabel="Account">
        <HandTabs selected={["Profile"]} />
      </View>
    )
    await expect(checkTabs()).rejects.toThrow(
      'the tab "Profile" can\'t be reached'
    )
  })

  test("fails on a tab with no selected state, and on two selected tabs", async () => {
    await render(
      <View accessibilityRole={listRole}>
        <Pressable accessibilityRole="tab">
          <Text>Profile</Text>
        </Pressable>
      </View>
    )
    await expect(checkTabs()).rejects.toThrow("has no selected state")
    await render(<HandTabs selected={["Profile", "Billing"]} />)
    await expect(checkTabs()).rejects.toThrow("has 2 selected tabs")
  })

  test("fails on tabs with no tab selected", async () => {
    await render(<HandTabs selected={[]} stuck />)
    await expect(checkTabs()).rejects.toThrow("has no selected tab")
  })

  test("fails on a tab that isn't selected after the activate action", async () => {
    await render(<HandTabs selected={["Profile"]} stuck />)
    await expect(checkTabs()).rejects.toThrow(
      'the tab "Billing" isn\'t selected after the activate action'
    )
  })
})

// A disclosure written by hand. Its content follows a press when `pressShows`
// and TalkBack's actions when `actionShows`, which it declares when `declares`.
function HandDisclosure({
  pressShows = true,
  actionShows = true,
  declares = true,
  hides = true,
  inButton = false,
}: {
  pressShows?: boolean
  actionShows?: boolean
  declares?: boolean
  hides?: boolean
  inButton?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [shown, setShown] = useState(false)
  const change = (next: boolean, shows: boolean) => {
    setExpanded(next)
    if (shows && (next || hides)) {
      setShown(next)
    }
  }
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityActions={
          declares ? [{ name: expanded ? "collapse" : "expand" }] : undefined
        }
        onAccessibilityAction={(event) =>
          change(event.nativeEvent.actionName === "expand", actionShows)
        }
        onPress={() => change(!expanded, pressShows)}
      >
        <Text>Order #4189</Text>
        {inButton && expanded ? <View /> : null}
      </Pressable>
      {shown && !inButton ? <Text>Linen shirt</Text> : null}
    </View>
  )
}

describe("checkPattern's disclosure pattern on the native host", () => {
  test("passes on a collapsible, opening and closing it, and on a disabled one", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
        <CollapsiblePanel>
          <Text>Linen shirt</Text>
        </CollapsiblePanel>
      </Collapsible>
    )
    await expect(checkDisclosure()).resolves.toBeUndefined()
    await render(
      <Collapsible disabled>
        <CollapsibleTrigger>
          <Text>Order #4189</Text>
        </CollapsibleTrigger>
      </Collapsible>
    )
    await expect(checkDisclosure()).resolves.toBeUndefined()
  })

  test("fails on a button whose content doesn't follow its expanded state after the activate action", async () => {
    await render(<HandDisclosure pressShows={false} />)
    await expect(checkDisclosure()).rejects.toThrow(
      'the button "Order #4189" shows no content after the activate action'
    )
  })

  test("fails on a button whose content stays after the activate action collapses it", async () => {
    await render(<HandDisclosure hides={false} />)
    await expect(checkDisclosure()).rejects.toThrow(
      'the button "Order #4189" hides no content after the activate action'
    )
  })

  test("fails on a button that shows nothing outside itself", async () => {
    await render(<HandDisclosure inButton />)
    await expect(checkDisclosure()).rejects.toThrow(
      'the button "Order #4189" shows no content after the activate action'
    )
  })

  test("on Android, fails on a button whose content doesn't follow TalkBack's expand action", async () => {
    await render(<HandDisclosure actionShows={false} />)
    const checked = checkDisclosure()
    if (os === "ios") {
      await expect(checked).resolves.toBeUndefined()
    } else {
      await expect(checked).rejects.toThrow(
        'the button "Order #4189" shows no content after the expand action'
      )
    }
  })

  test("on Android, fails on a disclosure button with no expand action", async () => {
    await render(<HandDisclosure declares={false} />)
    const checked = checkDisclosure()
    if (os === "ios") {
      await expect(checked).resolves.toBeUndefined()
    } else {
      await expect(checked).rejects.toThrow(
        'the button "Order #4189" has no expand action'
      )
    }
  })

  test("fails with no button that has an expanded state", async () => {
    await render(
      <Pressable accessibilityRole="button">
        <Text>Order #4189</Text>
      </Pressable>
    )
    await expect(checkDisclosure()).rejects.toThrow(
      "has no button with an expanded state"
    )
  })

  test("fails on a disclosure button with no name", async () => {
    await render(
      <Collapsible>
        <CollapsibleTrigger />
      </Collapsible>
    )
    await expect(checkDisclosure()).rejects.toThrow("the button has no name")
  })

  test("fails on a button whose expanded state doesn't change after the activate action", async () => {
    await render(
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: false }}
        onPress={() => {}}
      >
        <Text>Order #4189</Text>
      </Pressable>
    )
    await expect(checkDisclosure()).rejects.toThrow(
      "stays collapsed after the activate action"
    )
  })
})

function Faq(props: React.ComponentProps<typeof Accordion>) {
  return (
    <Accordion {...props}>
      {["Shipping", "Returns"].map((name) => (
        <AccordionItem key={name} value={name}>
          <AccordionHeader>
            <AccordionTrigger>
              <Text>{name}</Text>
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>
            <Text>{`${name} answer`}</Text>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

describe("checkPattern's accordion pattern on the native host", () => {
  test("passes on one item open at a time, several, one that must stay open, and a disabled accordion", async () => {
    await render(<Faq />)
    await expect(checkAccordion()).resolves.toBeUndefined()
    await render(<Faq multiple defaultValue={["Shipping"]} />)
    await expect(checkAccordion()).resolves.toBeUndefined()
    await render(<Faq collapsible={false} defaultValue={["Shipping"]} />)
    await expect(checkAccordion()).resolves.toBeUndefined()
    await render(<Faq disabled />)
    await expect(checkAccordion()).resolves.toBeUndefined()
  })

  test("fails on a screen with no button that has an expanded state", async () => {
    await render(
      <Button>
        <Text>Save</Text>
      </Button>
    )
    await expect(checkAccordion()).rejects.toThrow(
      "has no button with an expanded state, so it isn't an accordion"
    )
  })

  test("fails on a header button whose content doesn't follow the activate action", async () => {
    await render(<HandDisclosure pressShows={false} />)
    await expect(checkAccordion()).rejects.toThrow(
      'the button "Order #4189" shows no content after the activate action'
    )
  })
})

describe("checkPattern's scroll area pattern on the native host", () => {
  test("passes on a scroll area with its scrollbars and scroll-to-end button", async () => {
    await render(
      <ScrollArea>
        <ScrollAreaViewport>
          <ScrollAreaContent>
            <Text>Release notes</Text>
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar>
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaScrollbar orientation="horizontal">
          <ScrollAreaThumb />
        </ScrollAreaScrollbar>
        <ScrollAreaCorner />
        <ScrollAreaScrollToEnd>
          <Text>Latest</Text>
        </ScrollAreaScrollToEnd>
      </ScrollArea>
    )
    await expect(checkScrollArea()).resolves.toBeUndefined()
  })

  test("fails on content a screen reader reads beside the viewport", async () => {
    await render(
      <ScrollArea>
        <ScrollAreaViewport />
        <Text>Thumb</Text>
      </ScrollArea>
    )
    await expect(checkScrollArea()).rejects.toThrow(
      'the Text "Thumb" is read beside the ScrollView; a scroll area\'s scrollbars, thumbs and corner are hidden from screen readers.'
    )
  })

  test("fails on a viewport read as one element", async () => {
    await render(
      <ScrollArea>
        <ScrollAreaViewport accessible aria-label="Notes">
          <Text>Release notes</Text>
        </ScrollAreaViewport>
      </ScrollArea>
    )
    await expect(checkScrollArea()).rejects.toThrow(
      "is one accessible element, so a screen reader can't read its content item by item."
    )
  })

  test("fails with no ScrollView", async () => {
    await render(<View />)
    await expect(checkScrollArea()).rejects.toThrow(
      "The tree has no ScrollView, so a screen reader can't scroll it."
    )
  })
})

describe("checkPattern's separator pattern on the native host", () => {
  test("passes on separators, decorative or not, in either orientation", async () => {
    await render(
      <View>
        <Separator />
        <Separator orientation="vertical" />
        <Separator decorative />
      </View>
    )
    await expect(checkSeparator()).resolves.toBeUndefined()
  })

  test("fails on a separator a screen reader stops on", async () => {
    await render(<Separator accessible aria-label="Section break" />)
    await expect(checkSeparator()).rejects.toThrow(
      'the View "Section break" is an element a screen reader stops on; a separator is structure, never read on its own.'
    )
  })

  test("fails on a separator the keyboard stops on", async () => {
    await render(<Separator focusable />)
    await expect(checkSeparator()).rejects.toThrow(
      "the View is a keyboard stop; a separator is never focusable."
    )
  })

  test("fails on a separator with a role", async () => {
    await render(<Separator accessibilityRole="button" />)
    await expect(checkSeparator()).rejects.toThrow(
      'the button has the button role; a separator has no role on native, or "none".'
    )
  })

  test("fails on text inside a separator, which a screen reader reads", async () => {
    await render(
      <Separator>
        <Text>or</Text>
      </Separator>
    )
    await expect(checkSeparator()).rejects.toThrow(
      'the Text "or" is an element a screen reader stops on'
    )
  })
})

function Pages(props: React.ComponentProps<typeof Pagination>) {
  return (
    <Pagination aria-label="Pagination" {...props}>
      <PaginationList>
        {({ items }) => (
          <>
            <PaginationItem>
              <PaginationPrevious aria-label="Previous" />
            </PaginationItem>
            {items.map((item) => (
              <PaginationItem key={item}>
                {typeof item === "number" ? (
                  <PaginationLink page={item} />
                ) : (
                  <PaginationEllipsis />
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext aria-label="Next" />
            </PaginationItem>
          </>
        )}
      </PaginationList>
    </Pagination>
  )
}

describe("checkPattern's pagination pattern on the native host", () => {
  test("passes on a pagination, going to another page from each enabled button", async () => {
    const onPageChange = jest.fn()
    await render(<Pages pageCount={12} onPageChange={onPageChange} />)
    await expect(checkPagination()).resolves.toBeUndefined()
    expect(onPageChange).toHaveBeenCalled()
  })

  test("fails with no current page", async () => {
    await render(
      <Pressable accessibilityRole="button">
        <Text>1</Text>
      </Pressable>
    )
    await expect(checkPagination()).rejects.toThrow(
      "has no selected page; the current page is selected."
    )
  })

  test("fails on a page that goes nowhere", async () => {
    await render(
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: true }}
        >
          <Text>1</Text>
        </Pressable>
        <Pressable accessibilityRole="button">
          <Text>2</Text>
        </Pressable>
      </View>
    )
    await expect(checkPagination()).rejects.toThrow(
      `the button "2" leaves the current page "1" after the activate action; a page or a step that isn't disabled goes to another page.`
    )
  })

  test("passes on pages that share a name, telling the current one by its view", async () => {
    await render(
      <Pagination pageCount={2}>
        <PaginationLink page={1} aria-label="Same" />
        <PaginationLink page={2} aria-label="Same" />
      </Pagination>
    )
    await expect(checkPagination()).resolves.toBeUndefined()
  })

  test("fails on an unnamed step", async () => {
    await render(
      <Pagination pageCount={3}>
        <PaginationLink page={1} />
        <PaginationNext />
      </Pagination>
    )
    await expect(checkPagination()).rejects.toThrow(
      "has no name; a button needs an accessibilityLabel or text inside it."
    )
  })
})

describe("checkPattern's file-input pattern on the native host", () => {
  const files = ["a.png", "b.png", "c.png"].map((name) => ({
    name,
    size: 1,
    type: "image/png",
    uri: `file:///${name}`,
  }))
  const checkFiles = () =>
    checkPattern(screen.container, "file-input", { os, act })

  function Files({ disabled }: { disabled?: boolean }) {
    return (
      <FileInput multiple defaultValue={files} disabled={disabled}>
        <FileInputTrigger>
          <Text>Choose files</Text>
        </FileInputTrigger>
        <FileInputList>
          <FileInputItem>
            {({ file }) => (
              <>
                <Text>{file.name}</Text>
                <FileInputItemRemove />
              </>
            )}
          </FileInputItem>
        </FileInputList>
      </FileInput>
    )
  }

  test("passes on a file input, each remove button taking its own file away", async () => {
    await render(<Files />)
    await expect(checkFiles()).resolves.toBeUndefined()
    expect(screen.queryByText("a.png")).toBeNull()
    expect(screen.queryByText("c.png")).toBeNull()
  })

  test("passes on two files with the same name", async () => {
    const twins = files
      .slice(0, 2)
      .map((file) => ({ ...file, name: "IMG_0001.jpg" }))
    await render(
      <FileInput multiple defaultValue={twins}>
        <FileInputTrigger>
          <Text>Choose files</Text>
        </FileInputTrigger>
        <FileInputList>
          <FileInputItem>{() => <FileInputItemRemove />}</FileInputItem>
        </FileInputList>
      </FileInput>
    )
    await expect(checkFiles()).resolves.toBeUndefined()
  })

  test("passes on a disabled file input, leaving its files", async () => {
    await render(<Files disabled />)
    await expect(checkFiles()).resolves.toBeUndefined()
    expect(screen.getByText("b.png")).toBeOnTheScreen()
  })

  test("fails on a remove button that takes another file away", async () => {
    function Wrong() {
      const [names, setNames] = useState(["a.png", "b.png"])
      return (
        <View accessibilityRole="list">
          {names.map((name) => (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${name}`}
              onPress={() =>
                setNames((all) => all.filter((n) => n !== "b.png"))
              }
            />
          ))}
        </View>
      )
    }
    await render(<Wrong />)
    await expect(checkFiles()).rejects.toThrow(
      `the button "Remove a.png" doesn't remove only its own file after the activate action; a remove button in the list takes its item away.`
    )
  })
})

describe("checkPattern's date-picker pattern on the native host", () => {
  const checkDatePicker = () =>
    checkPattern(screen.container, "date-picker", { os, act })

  test.each(["single", "range"] as const)(
    "passes on a date picker in %s mode, picking a day in its popup",
    async (mode) => {
      await render(
        <OverlayHost>
          <DatePicker
            mode={mode}
            locale="en-US"
            today="2026-10-01"
            defaultMonth="2026-10"
          >
            <DatePickerInput aria-label="Start" />
            {mode === "range" && <DatePickerInput end aria-label="End" />}
            <DatePickerClear aria-label="Clear" />
            <DatePickerTrigger />
            <DatePickerContent />
          </DatePicker>
        </OverlayHost>
      )
      await expect(checkDatePicker()).resolves.toBeUndefined()
    },
    30_000
  )

  test("fails when no button opens a popup", async () => {
    await render(
      <Pressable accessibilityRole="button">
        <Text>Choose date</Text>
      </Pressable>
    )
    await expect(checkDatePicker()).rejects.toThrow(
      "has no button that opens its calendar in a view that takes the escape gesture."
    )
  })
})

describe("checkPattern's calendar pattern on the native host", () => {
  test("passes on a calendar picking one date, several or a range, selecting each enabled day", async () => {
    const onValueChange = jest.fn()
    await render(
      <View>
        <Calendar
          defaultValue="2026-10-16"
          unavailable={["2026-10-20"]}
          locale="en-US"
          onValueChange={onValueChange}
        />
        <Calendar mode="multiple" defaultMonth="2026-11" locale="en-US" />
        <Calendar mode="range" defaultMonth="2026-12" locale="en-US" />
      </View>
    )
    await expect(checkCalendar()).resolves.toBeUndefined()
    expect(onValueChange).toHaveBeenCalled()
  }, 30_000)

  test("passes on a disabled calendar, which ignores the activation", async () => {
    await render(<Calendar disabled defaultMonth="2026-10" locale="en-US" />)
    await expect(checkCalendar()).resolves.toBeUndefined()
  })

  test("fails with no day", async () => {
    await render(
      <Pressable accessibilityRole="button">
        <Text>Next month</Text>
      </Pressable>
    )
    await expect(checkCalendar()).rejects.toThrow(
      "has no button with a selected state, so it has no days."
    )
  })

  test("fails on a day with no name", async () => {
    await render(
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: true }}
      />
    )
    await expect(checkCalendar()).rejects.toThrow(
      "has no name; a day needs an accessibilityLabel or text inside it."
    )
  })

  test("fails on a day that isn't selected after the activate action", async () => {
    await render(
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: false }}
      >
        <Text>16</Text>
      </Pressable>
    )
    await expect(checkCalendar()).rejects.toThrow(
      `the button "16" isn't selected after the activate action; activating a day that isn't disabled selects it.`
    )
  })
})

describe("checkPattern's progressbar and meter patterns on the native host", () => {
  test("passes on progress bars, determinate or not, named by a label or aria-label", async () => {
    await render(
      <View>
        <Progress value={60}>
          <ProgressLabel>Uploading photos</ProgressLabel>
          <ProgressValue />
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
        <Progress value={null} aria-label="Connecting">
          <ProgressTrack>
            <ProgressIndicator />
          </ProgressTrack>
        </Progress>
        <Progress value={null}>
          <ProgressLabel>Connecting to server</ProgressLabel>
        </Progress>
      </View>
    )
    await expect(checkProgress()).resolves.toBeUndefined()
  })

  test("passes on a meter whose range doesn't start at 0", async () => {
    await render(
      <Meter value={-5} min={-10} max={10} aria-label="Balance">
        <MeterValue />
      </Meter>
    )
    await expect(checkMeter()).resolves.toBeUndefined()
  })

  test("passes on a meter named by its Label part", async () => {
    await render(
      <Meter value={68}>
        <MeterLabel>Storage used</MeterLabel>
        <MeterValue />
      </Meter>
    )
    await expect(checkMeter()).resolves.toBeUndefined()
  })

  test("fails with no progress bar", async () => {
    await render(<Text>60%</Text>)
    await expect(checkProgress()).rejects.toThrow(
      "The tree has no element with the progressbar role, so it isn't a progressbar."
    )
  })

  test("fails on a bar named only by its value", async () => {
    await render(
      <Progress value={60}>
        <ProgressValue />
      </Progress>
    )
    await expect(checkProgress()).rejects.toThrow(/the progressbar has no name/)
  })

  test("fails on a value outside its range, or read as a fraction", async () => {
    await render(
      <View
        accessible
        collapsable={false}
        accessibilityRole="progressbar"
        accessibilityLabel="Balance"
        accessibilityValue={{ min: -10, max: 10, now: 12 }}
      />
    )
    await expect(checkMeter()).rejects.toThrow(
      /is 12, outside its range of -10 to 10[^]*has no value text/
    )
  })

  test("fails on a meter with no value", async () => {
    await render(
      <View
        accessible
        collapsable={false}
        accessibilityRole="progressbar"
        accessibilityLabel="Battery"
        accessibilityValue={{ min: 0, max: 100, text: "" }}
      />
    )
    await expect(checkMeter()).rejects.toThrow(
      "has no current value; a meter always has one."
    )
  })

  test("fails on a bar the keyboard stops on", async () => {
    await render(
      <Progress value={60} aria-label="Upload" focusable>
        <ProgressValue />
      </Progress>
    )
    await expect(checkProgress()).rejects.toThrow(
      'the progressbar "Upload" is a keyboard stop; a progressbar is read, never focused.'
    )
  })

  test("fails on a bar a screen reader can't reach as one element", async () => {
    await render(
      <View
        collapsable={false}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100 }}
      />
    )
    await expect(checkProgress()).rejects.toThrow(
      "isn't an accessible element; a screen reader reads a progressbar as one element with its value."
    )
  })
})

const checkSlider = () => checkPattern(screen.container, "slider", { os, act })

describe("checkPattern's slider pattern on the native host", () => {
  test("passes on a slider, a range named by its field's label, and a disabled one", async () => {
    await render(
      <View>
        <Slider defaultValue={30}>
          <SliderControl>
            <SliderTrack>
              <SliderIndicator />
              <SliderThumb aria-label="Volume" />
            </SliderTrack>
          </SliderControl>
        </Slider>
        <Field>
          <FieldLabel>Price</FieldLabel>
          <Slider defaultValue={[0, 100]} step={10}>
            <SliderControl>
              <SliderThumb />
              <SliderThumb index={1} />
            </SliderControl>
          </Slider>
        </Field>
        <Slider defaultValue={30} disabled>
          <SliderControl>
            <SliderThumb aria-label="Brightness" />
          </SliderControl>
        </Slider>
      </View>
    )
    await expect(checkSlider()).resolves.toBeUndefined()
  })

  test("fails with no slider", async () => {
    await render(<Text>30</Text>)
    await expect(checkSlider()).rejects.toThrow(
      "The tree has no accessible element with the adjustable role, so it isn't a slider."
    )
  })

  test("fails on a thumb with no name", async () => {
    await render(
      <Slider defaultValue={30}>
        <SliderControl>
          <SliderThumb />
        </SliderControl>
      </Slider>
    )
    await expect(checkSlider()).rejects.toThrow(/has no name; a slider needs/)
  })

  test("fails on a slider whose increment does nothing, or that declares no actions", async () => {
    await render(
      <View>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Stuck"
          accessibilityValue={{ min: 0, max: 10, now: 5, text: "5" }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={() => {}}
        />
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Silent"
          accessibilityValue={{ min: 0, max: 10, now: 5, text: "5" }}
        />
      </View>
    )
    await expect(checkSlider()).rejects.toThrow(
      /stays at 5 after the increment action[^]*doesn't declare the increment action/
    )
  })
})

describe("checkPattern's dialog patterns on the native host", () => {
  const checkDialog = () =>
    checkPattern(screen.container, "dialog", { os, act })

  test("passes on a dialog, opening it and closing it each way", async () => {
    await render(
      <Dialog>
        <DialogTrigger>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogBackdrop />
        <DialogContent>
          <DialogTitle>Profile</DialogTitle>
          <DialogClose>
            <Text>Done</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
    )
    await expect(checkDialog()).resolves.toBeUndefined()
  })

  test("passes on a drawer, opening it and closing it each way", async () => {
    await render(
      <Drawer>
        <DrawerTrigger>
          <Text>Move goal</Text>
        </DrawerTrigger>
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHandle aria-label="Resize" />
          <DrawerTitle>Move goal</DrawerTitle>
          <DrawerClose>
            <Text>Done</Text>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    )
    await expect(checkDialog()).resolves.toBeUndefined()
  })

  test("passes on an alert dialog", async () => {
    await render(
      <AlertDialog>
        <AlertDialogTrigger>
          <Text>Discard draft</Text>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Discard the draft?</AlertDialogTitle>
          <AlertDialogClose>
            <Text>Cancel</Text>
          </AlertDialogClose>
        </AlertDialogContent>
      </AlertDialog>
    )
    await expect(
      checkPattern(screen.container, "alertdialog", { os, act })
    ).resolves.toBeUndefined()
  })

  test.each([false, true])(
    "passes on a popover with modal %s, which opens beside its trigger",
    async (modal) => {
      await render(
        <OverlayHost>
          <Popover modal={modal}>
            <PopoverTrigger>
              <Text>Share</Text>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Share link</PopoverTitle>
              <PopoverClose>
                <Text>Done</Text>
              </PopoverClose>
            </PopoverContent>
          </Popover>
        </OverlayHost>
      )
      await expect(checkDialog()).resolves.toBeUndefined()
    }
  )

  test("fails on a popover whose expand action moves no focus", async () => {
    function Panel() {
      const [open, setOpen] = useState(false)
      const toggle = () => setOpen(!open)
      return (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            accessibilityActions={[{ name: open ? "collapse" : "expand" }]}
            onAccessibilityAction={toggle}
            onPress={toggle}
          >
            <Text>Share</Text>
          </Pressable>
          {open && (
            <View onAccessibilityEscape={toggle}>
              <Text accessibilityRole="header">Share link</Text>
            </View>
          )}
        </View>
      )
    }
    await render(<Panel />)
    await expect(checkDialog()).rejects.toThrow(
      os === "ios"
        ? "requests no accessibility focus when it opens the dialog"
        : "requests no accessibility focus after the expand action"
    )
  })

  test("fails on a dialog with no title", async () => {
    await render(
      <Dialog>
        <DialogTrigger>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogContent>
          <Text>Profile</Text>
        </DialogContent>
      </Dialog>
    )
    await expect(checkDialog()).rejects.toThrow(
      "has no button that opens a dialog in a Modal, named by its title with the header role."
    )
  })

  test("fails on a Modal that moves no focus and doesn't close", async () => {
    function Sheet() {
      const [open, setOpen] = useState(false)
      return (
        <View>
          <Pressable accessibilityRole="button" onPress={() => setOpen(true)}>
            <Text>Edit profile</Text>
          </Pressable>
          <Modal visible={open} onRequestClose={() => {}}>
            <View onAccessibilityEscape={() => {}}>
              <Text accessibilityRole="header">Profile</Text>
            </View>
          </Modal>
        </View>
      )
    }
    await render(<Sheet />)
    await expect(checkDialog()).rejects.toThrow(
      "requests no accessibility focus when it opens the dialog"
    )
    await expect(checkDialog()).rejects.toThrow(
      os === "ios"
        ? "stays open after the escape action."
        : "stays open after Android's back."
    )
  })
})

describe("checkPattern's toolbar pattern on the native host", () => {
  test("passes on a toolbar whose buttons, toggles, links and fields are each their own element", async () => {
    const onPressedChange = jest.fn()
    await render(
      <Toolbar aria-label="Formatting">
        <Toggle aria-label="Bold" onPressedChange={onPressedChange} />
        <ToggleGroup aria-label="Alignment" defaultValue={["left"]}>
          <Toggle value="left" aria-label="Align left" />
          <Toggle value="right" aria-label="Align right" />
        </ToggleGroup>
        <ToolbarSeparator />
        <ToolbarGroup disabled aria-label="History">
          <ToolbarButton aria-label="Undo" />
        </ToolbarGroup>
        <ToolbarLink>
          <Text>Help</Text>
        </ToolbarLink>
        <ToolbarInput aria-label="Find" />
      </Toolbar>
    )
    await expect(checkToolbar()).resolves.toBeUndefined()
    expect(onPressedChange.mock.calls.map(([pressed]) => pressed)).toEqual([
      true,
      false,
    ])
  })

  test("fails with no toolbar role", async () => {
    await render(
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel="Bold" />
      </View>
    )
    await expect(checkToolbar()).rejects.toThrow(
      "has no view with the toolbar role"
    )
  })

  test("fails on a toolbar read as one element, which hides its controls", async () => {
    await render(
      <Toolbar aria-label="Formatting" accessible>
        <ToolbarButton aria-label="Bold" />
      </Toolbar>
    )
    await expect(checkToolbar()).rejects.toThrow(
      "is one accessible element; each control in a toolbar is its own"
    )
  })

  test("fails on a toolbar with no control, and on a control with no name", async () => {
    await render(
      <Toolbar aria-label="Empty">
        <ToolbarSeparator />
      </Toolbar>
    )
    await expect(checkToolbar()).rejects.toThrow("holds no control")
    await render(
      <Toolbar aria-label="Formatting">
        <ToolbarButton />
      </Toolbar>
    )
    await expect(checkToolbar()).rejects.toThrow("the button has no name")
  })

  test("fails on two toolbars when one has no name", async () => {
    await render(
      <View>
        <Toolbar aria-label="Formatting">
          <ToolbarButton aria-label="Bold" />
        </Toolbar>
        <Toolbar>
          <ToolbarButton aria-label="Undo" />
        </Toolbar>
      </View>
    )
    await expect(checkToolbar()).rejects.toThrow(
      "has no name; a screen has more than one toolbar, so each needs an accessibilityLabel"
    )
  })
})

describe("checkPattern's toast pattern on the native host", () => {
  const checkToast = () => checkPattern(screen.container, "toast", { os, act })

  test("passes on toasts whose action and close buttons dismiss them", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <ToastRegion toaster={toaster} />
      </OverlayHost>
    )
    await act(async () => {
      toaster({
        title: "Deleted",
        duration: Infinity,
        action: { label: "Undo", onAction: () => {} },
      })
      toaster({
        title: "Saved",
        duration: Infinity,
        cancel: { label: "Dismiss" },
      })
    })
    await expect(checkToast()).resolves.toBeUndefined()
    expect(screen.queryByText("Deleted")).toBeNull()
    expect(screen.queryByText("Saved")).toBeNull()
  })

  test("fails with no toast showing", async () => {
    await render(
      <OverlayHost>
        <ToastRegion toaster={createToaster()} />
      </OverlayHost>
    )
    await expect(checkToast()).rejects.toThrow("shows no toast with text")
  })

  test("fails on an unnamed close button", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <ToastRegion toaster={toaster}>
          {() => (
            <Toast>
              <ToastTitle />
              <ToastClose />
            </Toast>
          )}
        </ToastRegion>
      </OverlayHost>
    )
    await act(async () => {
      toaster({ title: "Saved", duration: Infinity })
    })
    await expect(checkToast()).rejects.toThrow(
      "has no name; a button needs an accessibilityLabel or text inside it."
    )
  })

  test("fails on an action that leaves its toast showing", async () => {
    const toaster = createToaster()
    await render(
      <OverlayHost>
        <ToastRegion toaster={toaster}>
          {() => (
            <Toast>
              <ToastTitle />
              <ToastAction dismiss={false} />
            </Toast>
          )}
        </ToastRegion>
      </OverlayHost>
    )
    await act(async () => {
      toaster({
        title: "Deleted",
        duration: Infinity,
        action: { label: "Undo", onAction: () => {} },
      })
    })
    await expect(checkToast()).rejects.toThrow("leaves its toast showing")
  })
})

describe("checkPattern's tooltip pattern on the native host", () => {
  const checkTooltip = () =>
    checkPattern(screen.container, "tooltip", { os, act })

  test.each([false, true])(
    "passes on tooltips that name and describe their triggers, toggleable %s",
    async (toggleable) => {
      await render(
        <OverlayHost>
          <Tooltip toggleable={toggleable}>
            <TooltipTrigger>
              <View />
            </TooltipTrigger>
            <TooltipContent>
              <Text>Add to library</Text>
            </TooltipContent>
          </Tooltip>
          <Tooltip toggleable={toggleable} defaultOpen>
            <TooltipTrigger>
              <Text>Export</Text>
            </TooltipTrigger>
            <TooltipContent>
              <Text>Download as CSV</Text>
            </TooltipContent>
          </Tooltip>
        </OverlayHost>
      )
      await expect(checkTooltip()).resolves.toBeUndefined()
    }
  )

  test("fails on a button its tooltip neither names nor describes", async () => {
    await render(
      <Pressable accessibilityRole="button">
        <Text>Export</Text>
      </Pressable>
    )
    await expect(checkTooltip()).rejects.toThrow(
      "is neither named nor described by its tooltip"
    )
  })

  test("fails on a tooltip that takes focus or stays open", async () => {
    function Sticky() {
      const [open, setOpen] = useState(false)
      return (
        <View>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Download as CSV"
            onPress={() => setOpen(true)}
          >
            <Text>Export</Text>
          </Pressable>
          {open && <Text>Download as CSV</Text>}
        </View>
      )
    }
    await render(<Sticky />)
    await expect(checkTooltip()).rejects.toThrow(
      "leaves its tooltip open when activated again"
    )
  })
})

import { act, cleanup, render, screen } from "@testing-library/react-native"
import { useState } from "react"
import { Platform, Text, View } from "react-native"
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "../src/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "../src/avatar"
import { Button } from "../src/button"
import { Checkbox, CheckboxIndicator } from "../src/checkbox"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "../src/collapsible"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../src/drawer"
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
import {
  FileInput,
  FileInputItem,
  FileInputItemRemove,
  FileInputList,
  FileInputTrigger,
} from "../src/file-input"
import { OTPInput, OTPInputGroup, OTPInputSlot } from "../src/otp-input"
import { OverlayHost } from "../src/overlays"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "../src/popover"
import { createToaster, ToastRegion } from "../src/toast"
import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "../src/hover-card"
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "../src/tooltip"
import {
  Pagination,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../src/pagination"
import { Calendar } from "../src/calendar"
import { DatePicker } from "../src/date-picker"
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
import { Resizable, ResizableHandle, ResizablePanel } from "../src/resizable"
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
import { Slider, SliderControl, SliderThumb } from "../src/slider"
import { Switch, SwitchThumb } from "../src/switch"
import { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab } from "../src/tabs"
import { checkDirection } from "../src/testing"
import { Toggle, ToggleGroup } from "../src/toggle"
import { Toolbar, ToolbarButton, ToolbarSeparator } from "../src/toolbar"

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

  test("passes on a slider, whose increment means the same either way", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Slider defaultValue={[20, 80]}>
              <SliderControl>
                <SliderThumb aria-label="Minimum" />
                <SliderThumb index={1} aria-label="Maximum" />
              </SliderControl>
            </Slider>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a calendar", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(<Calendar defaultValue="2026-02-16" locale="en-US" />)
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  }, 30_000)

  test("passes on a date picker, open", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
          await render(
            <OverlayHost>
              <DatePicker
                defaultOpen
                defaultValue="2026-02-16"
                locale="en-US"
              />
            </OverlayHost>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  }, 30_000)

  test("passes on a file input", async () => {
    const file = {
      name: "photo.png",
      size: 2_000,
      type: "image/png",
      uri: "file:///photo.png",
    }
    await expect(
      checkDirection(
        async () => {
          await render(
            <FileInput defaultValue={[file]}>
              <FileInputTrigger>
                <Text>Choose a file</Text>
              </FileInputTrigger>
              <FileInputList>
                <FileInputItem>
                  {({ file: shown }) => (
                    <>
                      <Text>{shown.name}</Text>
                      <FileInputItemRemove />
                    </>
                  )}
                </FileInputItem>
              </FileInputList>
            </FileInput>
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

  test("passes on a resizable group", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Resizable>
              <ResizablePanel>
                <Text>Files</Text>
              </ResizablePanel>
              <ResizableHandle aria-label="Resize files" />
              <ResizablePanel>
                <Text>Code</Text>
              </ResizablePanel>
            </Resizable>
          )
          await act(async () => {})
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a scroll area", async () => {
    await expect(
      checkDirection(
        async () => {
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

  test("passes on a segmented control", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <SegmentedControl aria-label="View" defaultValue="list">
              <SegmentedControlIndicator />
              <SegmentedControlItem value="list">
                <Text>List</Text>
              </SegmentedControlItem>
              <SegmentedControlItem value="grid">
                <Text>Grid</Text>
              </SegmentedControlItem>
            </SegmentedControl>
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

  test("passes on a toolbar", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Toolbar aria-label="Formatting">
              <Toggle aria-label="Bold" />
              <ToolbarSeparator />
              <ToolbarButton aria-label="Insert link" />
            </Toolbar>
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

  // The dialog opened in one direction stays open, and its Modal's host
  // would take the next one.
  test("passes on a dialog", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
          await render(
            <Dialog>
              <DialogTrigger>
                <Text>Edit profile</Text>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Profile</DialogTitle>
                <DialogClose>
                  <Text>Done</Text>
                </DialogClose>
              </DialogContent>
            </Dialog>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a drawer", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
          await render(
            <Drawer side="start">
              <DrawerTrigger>
                <Text>Menu</Text>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerClose>
                  <Text>Close</Text>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on an accordion", async () => {
    await expect(
      checkDirection(
        async () => {
          await render(
            <Accordion defaultValue={["shipping"]}>
              <AccordionItem value="shipping">
                <AccordionHeader>
                  <AccordionTrigger>
                    <Text>Shipping</Text>
                  </AccordionTrigger>
                </AccordionHeader>
                <AccordionPanel>
                  <Text>Ships in two days.</Text>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a tooltip, placed by its arrow's side", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
          await render(
            <OverlayHost>
              <Tooltip defaultOpen>
                <TooltipTrigger aria-label="Info" />
                <TooltipContent side="right">
                  <TooltipArrow />
                  <Text>Files in the trash still use storage.</Text>
                </TooltipContent>
              </Tooltip>
            </OverlayHost>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a hover card, placed by its arrow's side", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
          await render(
            <OverlayHost>
              <HoverCard defaultOpen>
                <HoverCardTrigger>
                  <Text>@hollis</Text>
                </HoverCardTrigger>
                <HoverCardContent side="right">
                  <HoverCardArrow />
                  <Text>Design engineer on the payments team.</Text>
                </HoverCardContent>
              </HoverCard>
            </OverlayHost>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a popover, placed by its arrow's side", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
          await render(
            <OverlayHost>
              <Popover>
                <PopoverTrigger>
                  <Text>Share</Text>
                </PopoverTrigger>
                <PopoverContent side="right">
                  <PopoverArrow />
                  <PopoverTitle>Share link</PopoverTitle>
                </PopoverContent>
              </Popover>
            </OverlayHost>
          )
          return screen.container
        },
        { os, act }
      )
    ).resolves.toBeUndefined()
  })

  test("passes on a toast", async () => {
    await expect(
      checkDirection(
        async () => {
          await cleanup()
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
              cancel: { label: "Dismiss" },
            })
          })
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

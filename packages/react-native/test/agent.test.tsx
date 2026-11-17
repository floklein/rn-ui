import { act, fireEvent, render, screen } from "@testing-library/react-native"
import { Text, View } from "react-native"
import { AgentRegion, createAgent } from "../src/agent"
import { Button } from "../src/button"
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
import { createHistory } from "../src/history"
import { Input } from "../src/input"
import { observe } from "../src/observe"
import { Switch } from "../src/switch"

const agent = createAgent()

const onScreen = () =>
  agent.snapshot().filter((component) => !component.offPage)
const labels = () => onScreen().map((component) => component.label)

test("a snapshot lists a part by its label and its text", async () => {
  await render(
    <>
      <Input aria-label="Project name" defaultValue="Apollo" />
      <Button>
        <Text>Save</Text>
      </Button>
    </>
  )
  expect(onScreen()).toEqual([
    expect.objectContaining({
      component: "input",
      label: "Project name",
      value: "Apollo",
    }),
    expect.objectContaining({ component: "button", label: "Save" }),
  ])
})

test("a snapshot leaves out a part whose slot isn't present", async () => {
  await render(
    <Collapsible>
      <CollapsibleTrigger>
        <Text>Advanced</Text>
      </CollapsibleTrigger>
      <CollapsiblePanel keepMounted>
        <Switch aria-label="Beta features" />
      </CollapsiblePanel>
    </Collapsible>
  )
  expect(labels()).toEqual(["Advanced"])
  await fireEvent.press(screen.getByText("Advanced"))
  expect(labels()).toEqual(["Advanced", "Beta features"])
})

test("a snapshot leaves out a part under a hidden mark", async () => {
  await render(
    <>
      <Switch aria-label="Notifications" />
      <Switch aria-label="Debug mode" data-agent-hidden />
    </>
  )
  expect(labels()).toEqual(["Notifications"])
})

test("a snapshot leaves out a part behind an open modal", async () => {
  await render(
    <>
      <Switch aria-label="Notifications" />
      <Dialog defaultOpen>
        <DialogTrigger>
          <Text>Edit profile</Text>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Profile</DialogTitle>
          <Switch aria-label="Public profile" />
          <DialogClose>
            <Text>Done</Text>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  )
  expect(onScreen()).toEqual([
    expect.objectContaining({
      component: "dialog",
      label: "Profile",
      text: ["Profile"],
      buttons: ["Done"],
    }),
    expect.objectContaining({ label: "Public profile" }),
  ])
})

test("act changes state with the agent as its source", async () => {
  const onCheckedChange = jest.fn()
  await render(
    <Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />
  )
  const result = await act(() =>
    agent.act({
      steps: [{ ref: "Notifications", action: "setChecked", args: [true] }],
    })
  )
  expect(result).toEqual(expect.objectContaining({ ok: true }))
  expect(onCheckedChange).toHaveBeenCalledWith(
    true,
    expect.objectContaining({ source: "agent" })
  )
  expect(screen.getByRole("switch")).toBeChecked()
})

test("a mark on the wrapper covers everything inside it", async () => {
  const onPress = jest.fn()
  await render(
    <>
      <Switch aria-label="Notifications" />
      <AgentRegion data-agent-hidden>
        <View>
          <Switch aria-label="Debug mode" />
          <Input aria-label="Token" />
        </View>
      </AgentRegion>
      <AgentRegion data-agent-secret>
        <Input aria-label="API key" defaultValue="sk-1" />
      </AgentRegion>
      <AgentRegion data-agent-confirm="Deletes the project">
        <Button onPress={onPress}>
          <Text>Delete</Text>
        </Button>
      </AgentRegion>
    </>
  )
  expect(onScreen()).toEqual([
    expect.objectContaining({ label: "Notifications" }),
    expect.objectContaining({ label: "API key", value: "[redacted]" }),
    expect.objectContaining({
      label: "Delete",
      confirm: "Deletes the project",
    }),
  ])
  const result = await act(() =>
    agent.act({ steps: [{ ref: "Delete", action: "press" }] })
  )
  expect(result.error?.message).toContain("Needs a person")
  expect(onPress).not.toHaveBeenCalled()
})

test("a press runs the part's press as the agent", async () => {
  const onPress = jest.fn()
  await render(
    <Button onPress={onPress}>
      <Text>Save</Text>
    </Button>
  )
  const result = await act(() =>
    agent.act({ steps: [{ ref: "Save", action: "press" }] })
  )
  expect(result).toEqual(expect.objectContaining({ ok: true }))
  expect(onPress).toHaveBeenCalledWith(
    undefined,
    expect.objectContaining({ source: "agent" })
  )
})

test("observe hears an agent's change, and history puts it back", async () => {
  const changes: unknown[] = []
  const stop = observe((change) => changes.push(change))
  const history = createHistory(agent)
  await render(<Switch aria-label="Notifications" />)
  await act(() =>
    agent.act({
      steps: [{ ref: "Notifications", action: "setChecked", args: [true] }],
    })
  )
  expect(changes).toEqual([
    expect.objectContaining({
      component: "switch",
      label: "Notifications",
      key: "checked",
      value: true,
      previous: false,
      source: "agent",
    }),
  ])
  await act(() => history.undoSource("agent"))
  expect(screen.getByRole("switch")).not.toBeChecked()
  history.destroy()
  stop()
})

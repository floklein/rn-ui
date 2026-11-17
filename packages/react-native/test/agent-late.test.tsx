import { render } from "@testing-library/react-native"
import { Switch } from "../src/switch"

test("an agent created after the app rendered finds its components", async () => {
  await render(<Switch aria-label="Notifications" />)
  const { createAgent } = await import("../src/agent")
  expect(createAgent().snapshot()).toEqual([
    expect.objectContaining({ component: "switch", label: "Notifications" }),
  ])
})

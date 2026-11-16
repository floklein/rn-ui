import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("meter")

beforeEach(() => device.open("fixture-meter"))

test("the indicator fills a range that doesn't start at 0 from its start", async () => {
  const [indicator, track] = await Promise.all([
    device.size("indicator"),
    device.size("track"),
  ])
  assert.ok(Math.abs(indicator.width / track.width - 0.25) < 0.02)
})

test("a meter is no keyboard stop", async () => {
  const attrs = await device.attributes("meter")
  if (device.platform === "ios") {
    assert.equal(attrs.accessible, "true")
  } else {
    assert.equal(attrs.focusable, "false")
    assert.equal(attrs.clickable, "false")
  }
})

const shown = [
  "Storage used",
  "Battery",
  "Credit score",
  "API requests",
  "Storage",
  "Disk",
]

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/meter/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-meter-${path.basename(file, ".tsx")}`)
    await device.expectTree((tree) =>
      assert.ok(
        [...tree.values()].some(
          (node) =>
            shown.includes(node.text ?? "") ||
            shown.some((text) => node.label.startsWith(text))
        )
      )
    )
  }
})

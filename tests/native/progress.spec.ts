import assert from "node:assert/strict"
import { readdirSync } from "node:fs"
import path from "node:path"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("progress")

beforeEach(() => device.open("fixture-progress"))

// iOS reads the label from the text inside and the value apart. Android's
// description is the value text, or the text inside while there is none.
async function reads(value: string, android = value) {
  const deadline = Date.now() + 5000
  for (;;) {
    const attrs = await device.attributes("progress")
    const read =
      device.platform === "ios"
        ? attrs.label === "Uploading photos" && (attrs.value ?? "") === value
        : (attrs["content-desc"] ?? "") === android
    if (read) {
      return
    }
    assert.ok(Date.now() < deadline, `the bar reads ${JSON.stringify(attrs)}`)
  }
}

async function share() {
  const [indicator, track] = await Promise.all([
    device.size("indicator"),
    device.size("track"),
  ])
  return indicator.width / track.width
}

test("the bar reads its value and follows it", async () => {
  await reads("40%")
  await device.press("step")
  await reads("70%")
})

test("an indeterminate bar reads no value", async () => {
  await device.press("unknown")
  await reads("", "Uploading photos")
})

test("the indicator is as wide as the value", async () => {
  assert.ok(Math.abs((await share()) - 0.4) < 0.02)
  await device.press("step")
  const deadline = Date.now() + 5000
  while (Math.abs((await share()) - 0.7) >= 0.02) {
    assert.ok(Date.now() < deadline, "the indicator never grew")
  }
})

test("a bar is no keyboard stop", async () => {
  for (const id of ["progress", "connecting"]) {
    const attrs = await device.attributes(id)
    if (device.platform === "ios") {
      assert.equal(attrs.accessible, "true", id)
    } else {
      assert.equal(attrs.focusable, "false", id)
      assert.equal(attrs.clickable, "false", id)
    }
  }
})

const shown = [
  "Exporting video",
  "Upload progress",
  "Uploading photos",
  "Connecting to server",
  "Copying files",
  "Battery",
  "Download",
  "Account setup, step 3 of 5",
]

test("each example opens", async () => {
  const folder = path.join(
    import.meta.dirname,
    "../../examples/components/progress/react-native"
  )
  for (const file of readdirSync(folder)) {
    await device.open(`screen-progress-${path.basename(file, ".tsx")}`)
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

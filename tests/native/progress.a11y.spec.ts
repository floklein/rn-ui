import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("progress.a11y")

beforeEach(() => device.open("fixture-progress"))

test("the platform tree reads each bar as one element, its value text hidden", async () => {
  await device.saveTree("first")
  const bar = await device.attributes("progress")
  const value = await device.attributes("progress-value")
  if (device.platform === "ios") {
    assert.equal(bar.label, "Uploading photos")
    assert.equal(bar.value, "40%")
    assert.ok(bar.traits?.split(", ").includes("UpdatesFrequently"))
    assert.equal(value.accessible, "false")
    assert.equal(
      (await device.attributes("progress-label")).accessible,
      "false"
    )
    assert.equal((await device.attributes("connecting")).label, "Connecting")
  } else {
    assert.equal(bar["content-desc"], "Uploading photos, 40%")
    assert.equal(value["a11y-important"], "false")
    assert.equal(
      (await device.tree()).get("progress-label")?.text,
      "Uploading photos"
    )
    assert.equal(
      (await device.attributes("connecting"))["content-desc"],
      "Connecting, "
    )
  }
})

test("no audit issues", async () => {
  assert.deepEqual(await device.audit(), [])
})

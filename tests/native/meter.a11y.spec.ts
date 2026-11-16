import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("meter.a11y")

beforeEach(() => device.open("fixture-meter"))

test("the platform tree reads the meter as one element, its value text hidden", async () => {
  await device.saveTree("first")
  const meter = await device.attributes("meter")
  if (device.platform === "ios") {
    assert.equal(meter.label, "Balance")
    assert.equal(meter.value, "25%")
    assert.equal((await device.attributes("meter-value")).accessible, "false")
  } else {
    assert.equal(meter["content-desc"], "25%")
    assert.equal(
      (await device.attributes("meter-value"))["a11y-important"],
      "false"
    )
  }
})

test("no audit issues", async () => {
  assert.deepEqual(await device.audit(), [])
})

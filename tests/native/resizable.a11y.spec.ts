import assert from "node:assert/strict"
import { beforeEach, test } from "node:test"
import { useDevice } from "./device.ts"

const device = useDevice("resizable.a11y")

async function handles() {
  const nodes = [...(await device.tree()).values()].filter(
    (node) => node.role === "slider"
  )
  return Object.fromEntries(nodes.map((node) => [node.label, node]))
}

beforeEach(() => device.open("fixture-resizable"))

test("each handle is a slider read as its panel's share", async () => {
  await device.saveTree("first")
  const tree = await handles()
  for (const label of ["Resize files", "Resize left", "Resize top"]) {
    assert.equal(tree[label]?.role, "slider", label)
    assert.equal(tree[label]?.enabled, true, label)
    assert.match(tree[label]?.value ?? "", /50/, label)
  }
})

test("no audit issues at first", async () => {
  assert.deepEqual(await device.audit(), [])
})

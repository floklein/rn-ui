import { describe, expect, test } from "vitest"
import { groupField } from "../src/foundation/forms/group-field"

const username = { name: "username" } as HTMLInputElement
const password = { name: "password" } as HTMLInputElement
const root = {
  querySelector: () => username,
} as unknown as HTMLElement

describe("groupField", () => {
  test("reaches the first field in the group's element", () => {
    expect(
      groupField(
        () => root,
        () => [],
        "group"
      ).control()
    ).toBe(username)
  })

  test("reaches the group's own field when it knows it, past an earlier one", () => {
    expect(
      groupField(
        () => root,
        () => [],
        "root",
        () => password
      ).control()
    ).toBe(password)
  })
})

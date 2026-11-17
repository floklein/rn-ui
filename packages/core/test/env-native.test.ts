import { afterEach, describe, expect, test, vi } from "vitest"
import { setNativeHost } from "../src/foundation/kernel/native-host"
import { isBrowser, isIOS, isRTL } from "../src/foundation/platform/env.native"

afterEach(() => setNativeHost(undefined))

function host(rtl: boolean) {
  setNativeHost({
    focus: vi.fn(),
    field: vi.fn(),
    announce: vi.fn(),
    activate: vi.fn(),
    compare: vi.fn(),
    isRTL: () => rtl,
    box: vi.fn(),
    follow: vi.fn(),
    adjustable: vi.fn(),
    scrollNear: vi.fn(),
    screenReader: vi.fn(),
    seen: vi.fn(),
    listen: vi.fn(),
  })
}

describe("direction on the native host", () => {
  test("isRTL follows the host, whatever the element", () => {
    host(true)
    expect(isRTL(undefined)).toBe(true)
    expect(isRTL({} as Element)).toBe(true)
    host(false)
    expect(isRTL({} as Element)).toBe(false)
  })

  test("isRTL is false before a host registers", () => {
    expect(isRTL(undefined)).toBe(false)
  })

  test("there is no browser, and so no iPhone browser", () => {
    expect(isBrowser).toBe(false)
    expect(isIOS()).toBe(false)
  })
})

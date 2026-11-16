import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { after, before } from "node:test"
import { remote } from "webdriverio"

type Platform = "ios" | "android"

type Node = {
  role: string
  label: string
  checked?: boolean
  enabled: boolean
  text?: string
  value?: string
}

const platform: Platform =
  process.env.DEVICE_PLATFORM === "android" ? "android" : "ios"
const output =
  process.env.DEVICE_SPEC_OUTPUT ??
  path.join(import.meta.dirname, "../test-results/native")

// The first iOS session on a runner that just booted its simulator took up
// to 3m26s, past WebDriverAgent's and the client's defaults, and a 60-second
// gap between commands outlived the driver's (issue #29).
const limits = {
  wdaLaunch: 120_000,
  response: 300_000,
  newCommand: 300,
}

const capabilities =
  platform === "ios"
    ? {
        platformName: "iOS",
        "appium:automationName": "XCUITest",
        "appium:udid": process.env.SIMULATOR_UDID,
        "appium:simulatorDevicesSetPath": process.env.SIMULATOR_DEVICE_SET,
        "appium:app": process.env.APP_PATH,
        "appium:wdaLaunchTimeout": limits.wdaLaunch,
        "appium:newCommandTimeout": limits.newCommand,
        ...(process.env.WDA_PATH && {
          "appium:usePreinstalledWDA": true,
          "appium:prebuiltWDAPath": process.env.WDA_PATH,
        }),
        ...(process.env.CI && { "appium:isHeadless": true }),
        // Parallel iOS sessions on one machine each need their own port.
        ...(process.env.WDA_LOCAL_PORT && {
          "appium:wdaLocalPort": Number(process.env.WDA_LOCAL_PORT),
        }),
      }
    : {
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        "appium:udid": process.env.ANDROID_SERIAL,
        "appium:app": process.env.APP_PATH,
        "appium:newCommandTimeout": limits.newCommand,
        // An emulator from simlock sits behind its own adb server.
        ...(process.env.ANDROID_ADB_SERVER_PORT && {
          "appium:adbPort": Number(process.env.ANDROID_ADB_SERVER_PORT),
        }),
        ...(process.env.UIAUTOMATOR2_PORT && {
          "appium:systemPort": Number(process.env.UIAUTOMATOR2_PORT),
        }),
      }

const roles: Record<string, string> = {
  XCUIElementTypeSwitch: "switch",
  XCUIElementTypeButton: "button",
  XCUIElementTypeStaticText: "text",
  XCUIElementTypeTextField: "textbox",
  XCUIElementTypeTextView: "textbox",
  XCUIElementTypeOther: "group",
  "android.widget.Switch": "switch",
  "android.widget.Button": "button",
  "android.widget.TextView": "text",
  "android.widget.EditText": "textbox",
  "android.view.ViewGroup": "group",
}

const byId = (id: string) =>
  platform === "ios" ? `~${id}` : `android=new UiSelector().resourceId("${id}")`

// UiAutomator only finds what's on screen, so a screen low in the list is
// scrolled to first.
const scrolledTo = (id: string) =>
  `android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().resourceId("${id}"))`

function attributes(tag: string) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [
      name,
      value
        .replaceAll("&quot;", '"')
        .replaceAll("&apos;", "'")
        .replaceAll("&lt;", "<")
        .replaceAll("&gt;", ">")
        .replaceAll("&amp;", "&"),
    ])
  )
}

/** The OS's accessibility tree, as each element's role, label and state, keyed by test ID. */
function parseTree(source: string) {
  const nodes = new Map<string, Node>()
  for (const [, type, tag] of source.matchAll(/<([\w.]+)\s([^>]*?)\/?>/g)) {
    const attrs = attributes(tag)
    const id =
      platform === "ios"
        ? attrs.name
        : attrs["resource-id"]?.replace(/^.*:id\//, "")
    const role = roles[type] ?? type
    const node: Node = {
      role,
      label: (platform === "ios" ? attrs.label : attrs["content-desc"]) ?? "",
      enabled: attrs.enabled === "true",
    }
    if (role === "switch") {
      node.checked =
        platform === "ios" ? attrs.value === "1" : attrs.checked === "true"
    }
    if (role === "text") {
      node.text = platform === "ios" ? attrs.label : attrs.text
    }
    if (role === "textbox") {
      node.value = (platform === "ios" ? attrs.value : attrs.text) ?? ""
    }
    nodes.set(id && !nodes.has(id) ? id : `#${nodes.size}`, node)
  }
  return nodes
}

/**
 * Opens one Appium session for the spec file, on the app's screen list, and
 * closes it after the file's last test.
 */
function useDevice(name: string) {
  let driver: WebdriverIO.Browser
  const device = {
    platform,
    get driver() {
      return driver
    },
    async tree() {
      return parseTree(await driver.getPageSource())
    },
    async node(id: string) {
      const node = (await device.tree()).get(id)
      if (!node) {
        throw new Error(`No element with the test ID ${id} in the tree.`)
      }
      return node
    },
    /** Waits until `check` passes on the tree, failing with its last error. */
    async expectTree(check: (tree: Map<string, Node>) => void, timeout = 5000) {
      const deadline = Date.now() + timeout
      for (;;) {
        try {
          check(await device.tree())
          return
        } catch (error) {
          if (Date.now() > deadline) {
            throw error
          }
        }
        await new Promise((done) => setTimeout(done, 250))
      }
    },
    async press(id: string) {
      await driver.$(byId(id)).click()
    },
    /** The test ID of the element the OS's input focus is on, as a text field being edited. */
    async focused() {
      const active = await driver.getActiveElement()
      // XCUITest answers with an error object while nothing has focus.
      if ("error" in active) {
        return undefined
      }
      const element = await driver.$(active)
      return platform === "ios"
        ? element.getAttribute("name")
        : (await element.getAttribute("resource-id"))?.replace(/^.*:id\//, "")
    },
    /** Types into the element the OS's input focus is on. */
    async type(text: string) {
      await driver.keys(text.split(""))
    },
    async open(screen: string) {
      if (await driver.$(byId("back")).isExisting()) {
        await driver.$(byId("back")).click()
      }
      const item = driver.$(
        platform === "ios" ? byId(screen) : scrolledTo(screen)
      )
      await item.waitForExist({ timeout: 20_000 })
      await item.click()
      await driver.$(byId("back")).waitForExist({ timeout: 5000 })
    },
    async saveTree(state: string) {
      await mkdir(output, { recursive: true })
      await writeFile(
        path.join(output, `${platform}-${name}-${state}.xml`),
        await driver.getPageSource()
      )
    },
    /** Apple's accessibility audit of the screen; an empty list on Android, which has none. */
    async audit() {
      if (platform !== "ios") {
        return []
      }
      const issues = (await driver.execute(
        "mobile: performAccessibilityAudit",
        {}
      )) as {
        auditType: string
        compactDescription: string
        element?: string
      }[]
      return issues.map(
        (issue) =>
          `${issue.auditType}: ${issue.compactDescription}${issue.element ? ` (${issue.element})` : ""}`
      )
    },
  }

  before(async () => {
    driver = await remote({
      hostname: "127.0.0.1",
      port: Number(process.env.APPIUM_PORT ?? 4723),
      logLevel: "warn",
      connectionRetryTimeout: limits.response,
      connectionRetryCount: 0,
      capabilities,
    })
  })

  after(async () => {
    await driver?.deleteSession().catch((error) => console.error(error))
  })

  return device
}

export { type Node, useDevice }

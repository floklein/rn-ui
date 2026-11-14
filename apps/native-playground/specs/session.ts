import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { test } from "node:test"
import { remote } from "webdriverio"

type Element = ReturnType<WebdriverIO.Browser["$"]>

const platform = process.env.SPEC_PLATFORM === "android" ? "android" : "ios"
const output = process.env.SPEC_OUTPUT ?? join(import.meta.dirname, "output")

const capabilities =
  platform === "ios"
    ? {
        platformName: "iOS",
        "appium:automationName": "XCUITest",
        "appium:udid": process.env.SIMULATOR_UDID,
        "appium:app": process.env.APP_PATH,
        "appium:usePreinstalledWDA": true,
        "appium:prebuiltWDAPath": process.env.WDA_PATH,
        "appium:wdaLaunchTimeout": 120_000,
      }
    : {
        platformName: "Android",
        "appium:automationName": "UiAutomator2",
        "appium:app": process.env.APP_PATH,
      }

const byTestId = (id: string) =>
  platform === "ios" ? `~${id}` : `android=new UiSelector().resourceId("${id}")`

const byText = (text: string) =>
  platform === "ios"
    ? `-ios predicate string:label == "${text}"`
    : `android=new UiSelector().text("${text}")`

const role = (element: Element) =>
  element.getAttribute(platform === "ios" ? "type" : "class")

const roles =
  platform === "ios"
    ? { switch: "XCUIElementTypeSwitch", button: "XCUIElementTypeButton" }
    : { switch: "android.widget.Switch", button: "android.widget.Button" }

const label = (element: Element) =>
  element.getAttribute(platform === "ios" ? "label" : "content-desc")

async function isChecked(element: Element) {
  return platform === "ios"
    ? (await element.getAttribute("value")) === "1"
    : (await element.getAttribute("checked")) === "true"
}

async function isHeading(element: Element) {
  return platform === "ios"
    ? ((await element.getAttribute("traits")) ?? "")
        .split(", ")
        .includes("Header")
    : (await element.getAttribute("heading")) === "true"
}

async function openSession(name: string) {
  await mkdir(output, { recursive: true })
  const started = performance.now()
  const driver = await remote({
    hostname: "127.0.0.1",
    port: 4723,
    logLevel: "warn",
    capabilities,
  })
  const ready = performance.now()
  return {
    driver,
    async saveTree(state: string) {
      await writeFile(
        join(output, `${platform}-${name}-${state}.xml`),
        await driver.getPageSource()
      )
    },
    async close() {
      const finished = performance.now()
      await driver.deleteSession()
      await writeFile(
        join(output, `${platform}-${name}.json`),
        JSON.stringify({
          sessionSeconds: (ready - started) / 1000,
          testSeconds: (finished - ready) / 1000,
        })
      )
    },
  }
}

type Session = Awaited<ReturnType<typeof openSession>>

function spec(
  name: string,
  title: string,
  body: (session: Session) => Promise<void>
) {
  test(title, async () => {
    const session = await openSession(name)
    try {
      await body(session)
    } catch (error) {
      await session.saveTree("failed").catch(() => {})
      throw error
    } finally {
      await session.close()
    }
  })
}

export {
  byTestId,
  byText,
  isChecked,
  isHeading,
  label,
  platform,
  role,
  roles,
  spec,
}

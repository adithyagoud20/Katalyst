import { expect, test } from "@playwright/test";

test.describe("Protocol & Network Explorer", () => {
  test("launches Protocol Explorer from Playground and scrubs sequence", async ({ page }) => {
    await page.goto("/#katalyst=playground", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    // Click "All Labs" or look for launcher grid
    const allLabsBtn = page.getByRole("button", { name: /all labs/i });
    if (await allLabsBtn.isVisible()) {
      await allLabsBtn.click();
    }

    // Click "Launch Protocol Explorer"
    const launchBtn = page.getByText("Launch Protocol Explorer");
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Verify Protocol Explorer elements
    await expect(page.locator(".protocol-topology-canvas")).toBeVisible();
    await expect(page.locator(".protocol-sequence-container")).toBeVisible();
    await expect(page.locator(".protocol-packet-inspector")).toBeVisible();

    // Verify SVG topology map is rendered
    await expect(page.getByRole("img", { name: "Network Topology Map" })).toBeVisible();

    // Test Playback Controls: Step forward
    const stepNextBtn = page.getByRole("button", { name: /step forward/i });
    await expect(stepNextBtn).toBeVisible();
    await stepNextBtn.click();

    // Verify active step updated to Step 2
    await expect(page.locator(".protocol-sequence-container")).toContainText(/step 2 of/i);

    // Click a layer in the packet tree to inspect fields
    const packetTree = page.locator(".protocol-packet-inspector");
    await expect(packetTree).toBeVisible();

    // Click Hex Dump tab / ensure hex view is populated
    const hexTab = page.getByRole("button", { name: /hex dump/i });
    if (await hexTab.isVisible()) {
      await hexTab.click();
      await expect(page.locator(".protocol-hex-dump-container")).toBeVisible();
      await expect(page.locator(".protocol-hex-dump-container")).toContainText(/bytes total/i);
    }
  });

  test("switches to QUIC / HTTP/3 scenario and loads UDP transport sequence", async ({ page }) => {
    await page.goto("/#katalyst=playground", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    const allLabsBtn = page.getByRole("button", { name: /all labs/i });
    if (await allLabsBtn.isVisible()) {
      await allLabsBtn.click();
    }

    const launchBtn = page.getByText("Launch Protocol Explorer");
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Select QUIC scenario
    const selector = page.getByRole("combobox", { name: /select protocol scenario/i });
    await expect(selector).toBeVisible();
    await selector.selectOption("quic-handshake");

    // Verify QUIC Initial step is rendered
    await expect(page.locator(".protocol-sequence-container")).toContainText(/QUIC Initial/i);
    await expect(page.locator(".protocol-packet-inspector")).toContainText(/QUIC Long Header/i);

    // Switch to MQTT scenario
    await selector.selectOption("mqtt-telemetry");
    await expect(page.locator(".protocol-sequence-container")).toContainText(/CONNECT/i);
    await expect(page.locator(".protocol-packet-inspector")).toContainText(/MQTT Control Packet/i);
  });

  test("runs smoothly on mobile viewport (390px) with zero horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#katalyst=playground", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    // Open Lab Launcher
    const allLabsBtn = page.getByRole("button", { name: /all labs/i });
    if (await allLabsBtn.isVisible()) {
      await allLabsBtn.click();
    }

    // Launch Protocol Explorer
    const launchBtn = page.getByText("Launch Protocol Explorer");
    await expect(launchBtn).toBeVisible();
    await launchBtn.click();

    // Verify no horizontal document overflow
    const sizes = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(sizes.document, `document width ${sizes.document}px exceeded ${sizes.viewport}px`).toBeLessThanOrEqual(sizes.viewport);
    expect(sizes.body, `body width ${sizes.body}px exceeded ${sizes.viewport}px`).toBeLessThanOrEqual(sizes.viewport);

    // Switch between mobile tabs: Sequence -> Packet -> Hex
    await page.getByRole("button", { name: /packet tree/i }).click();
    await expect(page.locator(".protocol-packet-inspector")).toBeVisible();

    await page.getByRole("button", { name: /hex dump/i }).click();
    await expect(page.locator(".protocol-hex-dump-container")).toBeVisible();
  });

  test("navigates to dedicated /protocols section and renders lifeline swimlanes and Wireshark view", async ({ page }) => {
    await page.goto("/protocols", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");

    // Verify dedicated section title & topology map
    await expect(page.getByRole("heading", { name: "Protocol & Network Explorer" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Network Topology Map" })).toBeVisible();

    // Verify Lifeline swimlane columns are present
    const sequenceContainer = page.locator(".protocol-sequence-container");
    await expect(sequenceContainer).toBeVisible();
    await expect(sequenceContainer.getByText("Client Browser")).toBeVisible();
    await expect(sequenceContainer.getByText("Web Server (katalyst.dev)")).toBeVisible();

    // Switch to Wireshark table view
    const wiresharkBtn = page.getByRole("button", { name: /wireshark/i });
    await expect(wiresharkBtn).toBeVisible();
    await wiresharkBtn.click();

    // Verify Wireshark column headers
    await expect(page.getByRole("columnheader", { name: "Protocol" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Source" })).toBeVisible();

    // Switch back to Lifelines
    const lifelinesBtn = page.getByRole("button", { name: /lifelines/i });
    await expect(lifelinesBtn).toBeVisible();
    await lifelinesBtn.click();
    await expect(sequenceContainer.getByText("Client Browser")).toBeVisible();
  });
});

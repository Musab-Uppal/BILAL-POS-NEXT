// @vitest-environment jsdom
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../lib/api", () => ({
  getReceipt: vi.fn(),
  reprintReceipt: vi.fn(),
}));

import ReceiptView from "../components/ReceiptView";

function encodePayload(payload) {
  return Buffer.from(encodeURIComponent(JSON.stringify(payload))).toString("base64");
}

describe("ReceiptView smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    // polyfill atob/btoa for jsdom (used by ReceiptView decoding logic)
    global.atob = (str) => Buffer.from(String(str || ""), "base64").toString("utf8");
    global.btoa = (str) => Buffer.from(String(str || "")).toString("base64");
  });

  it.skip("renders receipt details from URL payload without crashing", async () => {
    const payload = {
      customer_name: "Test Customer",
      previous_balance: 100,
      current_bill_amount: 50,
      payment_made: 20,
      this_bill_balance: 30,
      updated_balance: 130,
      payment_status: "partial",
      receipt_number: "RCPT-101",
      receipt_date: "2026-04-27T10:00:00.000Z",
      items: [
        {
          name: "Chicken",
          qty: 2,
          rate: 12.5,
          lineTotal: 25,
        },
      ],
    };

    // Also set navigation state fallback so ReceiptView can read location payload
    window.sessionStorage.setItem(
      "receipt_navigation_state",
      JSON.stringify({ payload }),
    );

    render(
      <ReceiptView
        searchParamsObj={{
          data: encodePayload(payload),
          print: "true",
        }}
        testPayload={payload}
      />,
    );

    await screen.findByText("Bilal Poultry Traders");

    expect(screen.getByText("Test Customer")).toBeTruthy();
    expect(screen.getByText("PREVIOUS BALANCE:")).toBeTruthy();
    expect(screen.getByText("Rs 100.00")).toBeTruthy();
    expect(screen.getByText("Chicken")).toBeTruthy();
    expect(screen.getByText("12.50")).toBeTruthy();

    await waitFor(() => {
      expect(screen.queryByText("No receipt data found")).toBeNull();
    });
  });
});

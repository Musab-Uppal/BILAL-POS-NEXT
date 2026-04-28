import { describe, expect, it } from "vitest";
import {
  buildCheckoutReceiptSnapshot,
  buildReportReceiptSnapshot,
  normalizeReceiptLookupResult,
  normalizeReceiptSnapshot,
} from "../lib/receipt";

describe("receipt helpers", () => {
  it("normalizes item totals when line total is missing", () => {
    const snapshot = normalizeReceiptSnapshot({
      customer_name: "fallback-user",
      total: 40,
      payment_amount: 10,
      items: [
        {
          name: "Drumstick",
          qty: 4,
          price_per_unit: 5,
        },
      ],
    });

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0].lineTotal).toBe(20);
    expect(snapshot.items[0].total).toBe(20);
  });

  it("builds a live checkout snapshot with item rate, quantity, and frozen balance", () => {
    const snapshot = buildCheckoutReceiptSnapshot({
      items: [
        {
          name: "Breast piece",
          qty: 2,
          factor: 1,
          price_per_unit: 15,
          lineTotal: 30,
          productId: 101,
        },
      ],
      total: 30,
      createdAt: "2026-04-27T08:05:00.000Z",
      orderDate: "2026-04-27",
      customer: {
        name: "dummy",
        balance: 20811.24,
        starting_balance: 20811.24,
      },
      customerName: "dummy",
      previousBalance: 20811.24,
      paymentAmount: 30,
      balanceDue: 0,
      paymentStatus: "paid",
      receiptNumber: "RCPT-1",
      orderId: 55,
    });

    expect(snapshot.customer_name).toBe("dummy");
    expect(snapshot.previous_balance).toBe(20811.24);
    expect(snapshot.current_bill_amount).toBe(30);
    expect(snapshot.payment_made).toBe(30);
    expect(snapshot.updated_balance).toBe(20811.24);
    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.items[0]).toMatchObject({
      name: "Breast piece",
      qty: 2,
      rate: 15,
      price_per_unit: 15,
      lineTotal: 30,
      productId: 101,
    });
  });

  it("normalizes a stored receipt row for reprints with receipt_items", () => {
    const snapshot = normalizeReceiptSnapshot({
      id: 42,
      order_id: 9,
      receipt_number: "RCPT-42",
      receipt_date: "2026-04-26T08:05:00.000Z",
      customer_name: "dummy",
      previous_balance: 1500,
      current_bill_amount: 2872,
      payment_made: 872,
      this_bill_balance: 2000,
      updated_balance: 3500,
      payment_status: "partial",
      receipt_items: [
        {
          product_name: "Gosht",
          quantity: 2,
          unit: "kg",
          price_per_unit: 25,
          total: 50,
          product_id: 7,
        },
      ],
    });

    expect(snapshot.receipt_number).toBe("RCPT-42");
    expect(snapshot.previous_balance).toBe(1500);
    expect(snapshot.current_bill_amount).toBe(2872);
    expect(snapshot.payment_made).toBe(872);
    expect(snapshot.updated_balance).toBe(3500);
    expect(snapshot.items[0]).toMatchObject({
      name: "Gosht",
      qty: 2,
      rate: 25,
      price_per_unit: 25,
      lineTotal: 50,
      product_id: 7,
    });
  });

  it("builds a report fallback snapshot from order data with customer balance preserved", () => {
    const snapshot = buildReportReceiptSnapshot({
      order: {
        id: 88,
        total: 2872,
        date: "2026-04-27",
        payment_amount: 2872,
        payment_status: "paid",
        balance_due: 0,
        customer_name: "dummy",
        items: [
          {
            name: "Chargha",
            quantity: "2",
            price: "18.5",
            total: "37.0",
            id: 11,
          },
        ],
      },
      customerName: "dummy",
      customerBalance: 20811.24,
    });

    expect(snapshot.customer_name).toBe("dummy");
    expect(snapshot.previous_balance).toBe(20811.24);
    expect(snapshot.current_bill_amount).toBe(2872);
    expect(snapshot.payment_made).toBe(2872);
    expect(snapshot.updated_balance).toBeCloseTo(20811.24);
    expect(snapshot.items[0]).toMatchObject({
      name: "Chargha",
      qty: 2,
      rate: 18.5,
      price_per_unit: 18.5,
      lineTotal: 37,
      productId: 11,
    });
  });

  it("normalizes receipt lookup results from the API", () => {
    const single = { id: 4, receipt_number: "RCPT-1" };
    const array = [{ id: 7, receipt_number: "RCPT-7" }];
    const emptyArray: any[] = [];

    expect(normalizeReceiptLookupResult(single)).toBe(single);
    expect(normalizeReceiptLookupResult(array)).toEqual(array[0]);
    expect(normalizeReceiptLookupResult(emptyArray)).toBeNull();
    expect(normalizeReceiptLookupResult(null)).toBeNull();
  });
});

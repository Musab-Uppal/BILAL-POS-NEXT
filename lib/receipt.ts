type AnyRecord = Record<string, any>;

const toNumber = (value: any) => Number.parseFloat(String(value ?? 0)) || 0;

const getItemRate = (item: AnyRecord) => {
  if (item.price_per_unit !== undefined && item.price_per_unit !== null) {
    return toNumber(item.price_per_unit);
  }

  if (item.rate !== undefined && item.rate !== null) {
    return toNumber(item.rate);
  }

  if (item.unit_price !== undefined && item.unit_price !== null) {
    return toNumber(item.unit_price);
  }

  if (item.price !== undefined && item.price !== null) {
    return toNumber(item.price);
  }

  return 0;
};

export const normalizeReceiptItem = (item: AnyRecord = {}) => {
  const quantity = toNumber(item.qty ?? item.quantity ?? item.count);
  const factor = toNumber(item.factor ?? 1) || 1;
  const rate = getItemRate(item);
  const lineTotalRaw =
    item.lineTotal ?? item.line_total ?? item.total ?? item.amount;
  const lineTotal =
    lineTotalRaw !== undefined && lineTotalRaw !== null
      ? toNumber(lineTotalRaw)
      : quantity * rate;
  const productId =
    item.productId ?? item.product_id ?? item.item_id ?? item.id ?? null;

  return {
    name:
      item.name ??
      item.product_name ??
      item.product?.name ??
      item.item?.name ??
      "Product",
    qty: quantity,
    factor,
    rate,
    price_per_unit: rate,
    lineTotal,
    total: lineTotal,
    productId,
    product_id: productId,
    unit: item.unit ?? item.measurement ?? "kg",
  };
};

export const normalizeReceiptSnapshot = (
  source: AnyRecord | null | undefined,
) => {
  const payload = source || {};
  const itemsSource = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.receipt_items)
      ? payload.receipt_items
      : [];

  const customerBalance = toNumber(
    payload.previous_balance ??
      payload.customer?.starting_balance ??
      payload.customer?.balance,
  );
  const currentBillAmount = toNumber(
    payload.current_bill_amount ?? payload.total ?? payload.amount,
  );
  const paymentMade = toNumber(payload.payment_made ?? payload.payment_amount);
  const thisBillBalance = toNumber(
    payload.this_bill_balance ??
      payload.balance_due ??
      currentBillAmount - paymentMade,
  );
  const updatedBalance = toNumber(
    payload.updated_balance ??
      customerBalance + currentBillAmount - paymentMade,
  );

  return {
    ...payload,
    id: payload.id ?? payload.saleId ?? payload.order_id ?? null,
    saleId: payload.saleId ?? payload.order_id ?? payload.id ?? null,
    receipt_number: payload.receipt_number ?? payload.receiptNumber ?? null,
    receipt_date:
      payload.receipt_date ??
      payload.createdAt ??
      payload.created_at ??
      payload.orderDate ??
      payload.date ??
      new Date().toISOString(),
    customer_name:
      payload.customer_name ??
      payload.customer?.name ??
      payload.customer ??
      null,
    previous_balance: customerBalance,
    current_bill_amount: currentBillAmount,
    payment_made: paymentMade,
    this_bill_balance: thisBillBalance,
    updated_balance: updatedBalance,
    payment_status: payload.payment_status ?? "paid",
    customer: payload.customer
      ? {
          ...payload.customer,
          name:
            payload.customer.name ??
            payload.customer_name ??
            payload.customer ??
            "Customer",
          balance: toNumber(
            payload.customer.balance ??
              payload.customer.starting_balance ??
              customerBalance,
          ),
          starting_balance: toNumber(
            payload.customer.starting_balance ??
              payload.customer.balance ??
              customerBalance,
          ),
        }
      : {
          name: payload.customer_name ?? "Customer",
          balance: customerBalance,
          starting_balance: customerBalance,
        },
    items: itemsSource.map((item: AnyRecord) => normalizeReceiptItem(item)),
  };
};

type ReceiptCartItem = AnyRecord;

export const buildReceiptDateTime = (
  orderDate?: string | null,
  timeZone = "Asia/Karachi",
) => {
  if (typeof orderDate === "string" && orderDate.includes("T")) {
    return orderDate;
  }

  const datePart = (orderDate || new Date().toISOString().split("T")[0]).slice(
    0,
    10,
  );

  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(now);
    const getPart = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "00";
    const hour = getPart("hour");
    const minute = getPart("minute");
    const second = getPart("second");

    return `${datePart}T${hour}:${minute}:${second}+05:00`;
  } catch {
    const timePart = new Date().toTimeString().split(" ")[0];
    return `${datePart}T${timePart}`;
  }
};

export const buildCheckoutReceiptSnapshot = ({
  items = [],
  total = 0,
  createdAt = new Date().toISOString(),
  orderDate,
  customer,
  customerName,
  previousBalance = 0,
  paymentAmount = 0,
  balanceDue = 0,
  paymentStatus = "paid",
  receiptNumber,
  receiptId,
  orderId,
}: {
  items?: ReceiptCartItem[];
  total?: number;
  createdAt?: string;
  orderDate?: string;
  customer?: AnyRecord | null;
  customerName?: string;
  previousBalance?: number;
  paymentAmount?: number;
  balanceDue?: number;
  paymentStatus?: string;
  receiptNumber?: string | null;
  receiptId?: number | string | null;
  orderId?: number | string | null;
}) =>
  normalizeReceiptSnapshot({
    items: items.map((item) =>
      normalizeReceiptItem({
        ...item,
        qty: item.qty ?? item.quantity,
        price_per_unit: item.price_per_unit ?? item.price,
        lineTotal: item.lineTotal ?? item.total,
      }),
    ),
    total,
    current_bill_amount: total,
    createdAt,
    orderDate,
    receipt_date: buildReceiptDateTime(orderDate || createdAt),
    customer: customer || {
      name: customerName || "Customer",
      balance: previousBalance,
      starting_balance: previousBalance,
    },
    customer_name: customerName || customer?.name,
    previous_balance: previousBalance,
    payment_amount: paymentAmount,
    payment_made: paymentAmount,
    balance_due: balanceDue,
    this_bill_balance: balanceDue,
    payment_status: paymentStatus,
    updated_balance: previousBalance + total - paymentAmount,
    receipt_number: receiptNumber,
    receipt_id: receiptId,
    order_id: orderId,
    saleId: orderId,
  });

export const buildReportReceiptSnapshot = ({
  order,
  customerName,
  customerBalance,
}: {
  order: AnyRecord;
  customerName?: string;
  customerBalance?: number;
}) =>
  buildCheckoutReceiptSnapshot({
    items: (order.items || []).map((item: AnyRecord) => ({
      name: item?.name || "Product",
      qty: parseFloat(item?.quantity) || 0,
      price_per_unit: parseFloat(item?.price) || 0,
      lineTotal: parseFloat(item?.total || item?.quantity * item?.price) || 0,
      productId: item?.id || Math.random().toString(36).substring(2, 11),
    })),
    total: parseFloat(order.total || order.amount) || 0,
    createdAt:
      order.receipt_date ||
      order.date ||
      order.order_date ||
      new Date().toISOString(),
    orderDate: order.receipt_date || order.order_date || order.date,
    customer: {
      name:
        order.customer_name || order.client?.name || customerName || "Customer",
      balance: parseFloat(String(customerBalance ?? 0)) || 0,
      starting_balance: parseFloat(String(customerBalance ?? 0)) || 0,
    },
    customerName:
      order.customer_name || order.client?.name || customerName || "Customer",
    previousBalance: parseFloat(String(customerBalance ?? 0)) || 0,
    paymentAmount: parseFloat(order.payment_amount) || 0,
    balanceDue: parseFloat(order.balance_due) || 0,
    paymentStatus: order.payment_status || "paid",
    orderId: order.id,
  });

export const normalizeReceiptLookupResult = (
  result: AnyRecord | AnyRecord[] | null | undefined,
) => {
  if (Array.isArray(result)) {
    return result[0] || null;
  }

  return result || null;
};

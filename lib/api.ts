"use client";

import { createClient } from "./supabase/client";

type ApiResponse<T> = { data: T };

const BASE_URL = "";

const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("access");
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("refresh");
};

const setTokens = (access?: string | null, refresh?: string | null) => {
  if (typeof window === "undefined") return;
  if (access) window.localStorage.setItem("access", access);
  if (refresh) window.localStorage.setItem("refresh", refresh);
};

const clearTokens = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("access");
  window.localStorage.removeItem("refresh");
  window.location.href = "/login";
};

function createApiError(message: string, status = 400, data?: any) {
  const err: any = new Error(message);
  err.response = {
    status,
    data: data || { detail: message, error: message },
  };
  return err;
}

function toNumber(value: any) {
  return Number.parseFloat(String(value || 0));
}

function formatDate(value: string | Date) {
  const d = new Date(value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeToSupabaseEmail(identifier: string) {
  const value = String(identifier || "").trim().toLowerCase();
  if (!value) return "";
  if (value.includes("@")) return value;
  return `${value}@pos.local`;
}

function mapReceiptRow(row: any) {
  return {
    id: row.id,
    order_id: row.order_id,
    receipt_number: row.receipt_number,
    receipt_date: row.receipt_date,
    customer: row.client_id,
    customer_name: row.customer_name,
    previous_balance: toNumber(row.previous_balance),
    current_bill_amount: toNumber(row.current_bill_amount),
    payment_made: toNumber(row.payment_made),
    this_bill_balance: toNumber(row.this_bill_balance),
    updated_balance: toNumber(row.updated_balance),
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    store_name: row.store_name,
    store_address: row.store_address,
    store_phone: row.store_phone,
    reprint_count: row.reprint_count,
    last_reprinted_at: row.last_reprinted_at,
    created_at: row.created_at,
    items: (row.receipt_items || []).map((it: any) => ({
      product_name: it.product_name,
      quantity: toNumber(it.quantity),
      unit: it.unit,
      price_per_unit: toNumber(it.price_per_unit),
      total: toNumber(it.total),
      product_id: it.product_id,
    })),
  };
}

export const apiGet = async (url: string): Promise<ApiResponse<any>> => {
  const supabase = createClient();

  if (url === "pricing/products/") {
    const { data, error } = await supabase
      .from("item")
      .select("id, name, price")
      .order("name", { ascending: true });

    if (error) throw createApiError(error.message, 400, error);

    return {
      data: (data || []).map((it) => ({
        id: it.id,
        product: it.id,
        product_name: it.name,
        name: it.name,
        price: toNumber(it.price),
      })),
    };
  }

  if (url === "customers/") {
    const { data, error } = await supabase
      .from("client")
      .select("id, name, balance")
      .order("name", { ascending: true });

    if (error) throw createApiError(error.message, 400, error);

    return {
      data: (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        balance: toNumber(c.balance),
        starting_balance: toNumber(c.balance),
      })),
    };
  }

  if (url.startsWith("customers/balances/?")) {
    const query = new URLSearchParams(url.split("?")[1] || "");
    const sortBy = query.get("sort") || "name";
    const order = query.get("order") === "desc" ? "desc" : "asc";

    let customerQuery = supabase.from("client").select("id, name, balance");
    if (sortBy === "balance") {
      customerQuery = customerQuery.order("balance", {
        ascending: order === "asc",
      });
    } else {
      customerQuery = customerQuery.order("name", {
        ascending: order === "asc",
      });
    }

    const { data: customers, error: customerError } = await customerQuery;
    if (customerError)
      throw createApiError(customerError.message, 400, customerError);

    const customerIds = (customers || []).map((c) => c.id);

    const { data: orders, error: orderError } = await supabase
      .from("order")
      .select("id, client_id, date")
      .in("client_id", customerIds.length ? customerIds : [-1]);

    if (orderError) throw createApiError(orderError.message, 400, orderError);

    const groupedByCustomer = new Map<number, any[]>();
    for (const orderRow of orders || []) {
      const list = groupedByCustomer.get(orderRow.client_id) || [];
      list.push(orderRow);
      groupedByCustomer.set(orderRow.client_id, list);
    }

    const customerData = (customers || []).map((customer) => {
      const customerOrders = groupedByCustomer.get(customer.id) || [];
      const sortedOrders = customerOrders.sort((a, b) =>
        String(a.date).localeCompare(String(b.date)),
      );
      const last = sortedOrders.length
        ? sortedOrders[sortedOrders.length - 1].date
        : null;

      return {
        id: customer.id,
        name: customer.name,
        balance: toNumber(customer.balance),
        order_count: customerOrders.length,
        last_order_date: last,
      };
    });

    const totalBalance = customerData.reduce((sum, c) => sum + c.balance, 0);

    return {
      data: {
        customers: customerData,
        total_balance: totalBalance,
        count: customerData.length,
        positive_balance_count: customerData.filter((c) => c.balance > 0)
          .length,
        negative_balance_count: customerData.filter((c) => c.balance < 0)
          .length,
        zero_balance_count: customerData.filter((c) => c.balance === 0).length,
      },
    };
  }

  if (url.startsWith("sales/receipts/by-order/")) {
    const orderId = Number(
      url.split("sales/receipts/by-order/")[1]?.replace("/", ""),
    );

    const { data, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("order_id", orderId)
      .single();

    if (error) throw createApiError(error.message, 404, error);

    return { data: mapReceiptRow(data) };
  }

  if (/^sales\/receipts\/\d+\/$/.test(url)) {
    const receiptId = Number(url.split("sales/receipts/")[1].replace("/", ""));

    const { data, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", receiptId)
      .single();

    if (error) throw createApiError(error.message, 404, error);

    return { data: mapReceiptRow(data) };
  }

  if (url.startsWith("sales/receipts/?")) {
    const query = new URLSearchParams(url.split("?")[1] || "");
    const customer = query.get("customer");
    const startDate = query.get("start_date");
    const endDate = query.get("end_date");

    let queryBuilder = supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .order("receipt_date", { ascending: false });

    if (customer) {
      queryBuilder = queryBuilder.eq("client_id", Number(customer));
    }

    if (startDate) {
      queryBuilder = queryBuilder.gte("receipt_date", `${startDate}T00:00:00`);
    }

    if (endDate) {
      queryBuilder = queryBuilder.lte("receipt_date", `${endDate}T23:59:59`);
    }

    const { data, error } = await queryBuilder;

    if (error) throw createApiError(error.message, 400, error);

    return { data: (data || []).map(mapReceiptRow) };
  }

  if (url === "auth/verify/") {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw createApiError(
        error?.message || "Authentication failed",
        401,
        error,
      );
    }

    return { data: user };
  }

  if (url.startsWith("sales/orders/reports/daily/?")) {
    const params = new URLSearchParams(url.split("?")[1] || "");
    const date = params.get("date");
    const customer = params.get("customer");

    let orderQuery = supabase
      .from("order")
      .select(
        "id, client_id, total, date, payment_amount, payment_status, balance_due",
      )
      .eq("date", date || formatDate(new Date()))
      .order("id", { ascending: false });

    if (customer) {
      orderQuery = orderQuery.eq("client_id", Number(customer));
    }

    const { data: orders, error: orderError } = await orderQuery;
    if (orderError) throw createApiError(orderError.message, 400, orderError);

    const orderIds = (orders || []).map((o) => o.id);
    const customerIds = Array.from(
      new Set((orders || []).map((o) => o.client_id)),
    );

    const [
      { data: orderItems, error: itemError },
      { data: customers, error: customerError },
    ] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, order_id, item_id, quantity, price, item:item_id(name)")
        .in("order_id", orderIds.length ? orderIds : [-1]),
      supabase
        .from("client")
        .select("id, name, balance")
        .in("id", customerIds.length ? customerIds : [-1]),
    ]);

    if (itemError) throw createApiError(itemError.message, 400, itemError);
    if (customerError)
      throw createApiError(customerError.message, 400, customerError);

    const customerMap = new Map((customers || []).map((c) => [c.id, c]));

    const payloadOrders = (orders || []).map((o) => {
      const items = (orderItems || [])
        .filter((i) => i.order_id === o.id)
        .map((i: any) => ({
          name: i.item?.name || "Unknown",
          quantity: toNumber(i.quantity),
          price: toNumber(i.price),
          total: toNumber(i.quantity) * toNumber(i.price),
        }));

      return {
        id: o.id,
        customer_name:
          customerMap.get(o.client_id)?.name || `Customer ${o.client_id}`,
        order_date: o.date,
        amount: toNumber(o.total),
        payment_amount: toNumber(o.payment_amount),
        payment_status: o.payment_status,
        balance_due: toNumber(o.balance_due),
        items_count: items.length,
        items,
      };
    });

    const total_sales = payloadOrders.reduce((sum, o) => sum + o.amount, 0);
    const total_paid = payloadOrders.reduce(
      (sum, o) => sum + o.payment_amount,
      0,
    );
    const total_due = payloadOrders.reduce((sum, o) => sum + o.balance_due, 0);

    let customer_filter: string | null = null;
    let customer_balance: number | null = null;

    if (customer) {
      const selected = customerMap.get(Number(customer));
      customer_filter = selected?.name || `Customer ID: ${customer}`;
      customer_balance = selected ? toNumber(selected.balance) : null;
    }

    return {
      data: {
        date: date || formatDate(new Date()),
        total_sales,
        total_paid,
        total_due,
        order_count: payloadOrders.length,
        customer_filter,
        customer_balance,
        orders: payloadOrders,
      },
    };
  }

  if (url.startsWith("sales/orders/reports/monthly/?")) {
    const params = new URLSearchParams(url.split("?")[1] || "");
    const customer = params.get("customer");
    const startDate = params.get("start_date");
    const endDate = params.get("end_date");

    let orderQuery = supabase
      .from("order")
      .select(
        "id, client_id, total, date, payment_amount, payment_status, balance_due",
      )
      .order("date", { ascending: false });

    if (customer) {
      orderQuery = orderQuery.eq("client_id", Number(customer));
    }
    if (startDate) {
      orderQuery = orderQuery.gte("date", startDate);
    }
    if (endDate) {
      orderQuery = orderQuery.lte("date", endDate);
    }

    const { data: orders, error: orderError } = await orderQuery;
    if (orderError) throw createApiError(orderError.message, 400, orderError);

    const orderIds = (orders || []).map((o) => o.id);
    const customerIds = Array.from(
      new Set((orders || []).map((o) => o.client_id)),
    );

    const [
      { data: orderItems, error: itemError },
      { data: customers, error: customerError },
    ] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, order_id, item_id, quantity, price, item:item_id(name)")
        .in("order_id", orderIds.length ? orderIds : [-1]),
      supabase
        .from("client")
        .select("id, name, balance")
        .in("id", customerIds.length ? customerIds : [-1]),
    ]);

    if (itemError) throw createApiError(itemError.message, 400, itemError);
    if (customerError)
      throw createApiError(customerError.message, 400, customerError);

    const customerMap = new Map((customers || []).map((c) => [c.id, c]));

    const ordersByMonth = new Map<string, any[]>();

    for (const o of orders || []) {
      const items = (orderItems || [])
        .filter((i) => i.order_id === o.id)
        .map((i: any) => ({
          name: i.item?.name || "Unknown",
          quantity: toNumber(i.quantity),
          price: toNumber(i.price),
          total: toNumber(i.quantity) * toNumber(i.price),
        }));

      const orderPayload = {
        id: o.id,
        customer_name:
          customerMap.get(o.client_id)?.name || `Customer ${o.client_id}`,
        order_date: o.date,
        amount: toNumber(o.total),
        payment_amount: toNumber(o.payment_amount),
        payment_status: o.payment_status,
        balance_due: toNumber(o.balance_due),
        items_count: items.length,
        items,
      };

      const monthKey = String(o.date).slice(0, 7);
      const list = ordersByMonth.get(monthKey) || [];
      list.push(orderPayload);
      ordersByMonth.set(monthKey, list);
    }

    const reports = Array.from(ordersByMonth.entries())
      .map(([month, monthOrders]) => ({
        month,
        total_sales: monthOrders.reduce((sum, mo) => sum + mo.amount, 0),
        order_count: monthOrders.length,
        orders: monthOrders,
      }))
      .sort((a, b) => b.month.localeCompare(a.month));

    let customer_filter: string | null = null;
    let customer_balance: number | null = null;

    if (customer) {
      const selected = customerMap.get(Number(customer));
      customer_filter = selected?.name || `Customer ID: ${customer}`;
      customer_balance = selected ? toNumber(selected.balance) : null;
    }

    return {
      data: {
        reports,
        customer_filter,
        customer_balance,
      },
    };
  }

  if (url.startsWith("sales/orders/reports/date-range/?")) {
    const params = new URLSearchParams(url.split("?")[1] || "");
    const customer = params.get("customer");
    const startDate = params.get("start_date");
    const endDate = params.get("end_date");

    if (!startDate || !endDate) {
      throw createApiError("Both start_date and end_date are required", 400);
    }

    let orderQuery = supabase
      .from("order")
      .select(
        "id, client_id, total, date, payment_amount, payment_status, balance_due",
      )
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (customer) {
      orderQuery = orderQuery.eq("client_id", Number(customer));
    }

    const { data: orders, error: orderError } = await orderQuery;
    if (orderError) throw createApiError(orderError.message, 400, orderError);

    const orderIds = (orders || []).map((o) => o.id);
    const customerIds = Array.from(
      new Set((orders || []).map((o) => o.client_id)),
    );

    const [
      { data: orderItems, error: itemError },
      { data: customers, error: customerError },
    ] = await Promise.all([
      supabase
        .from("order_items")
        .select("id, order_id, item_id, quantity, price, item:item_id(name)")
        .in("order_id", orderIds.length ? orderIds : [-1]),
      supabase
        .from("client")
        .select("id, name, balance")
        .in("id", customerIds.length ? customerIds : [-1]),
    ]);

    if (itemError) throw createApiError(itemError.message, 400, itemError);
    if (customerError)
      throw createApiError(customerError.message, 400, customerError);

    const customerMap = new Map((customers || []).map((c) => [c.id, c]));

    const payloadOrders = (orders || []).map((o) => {
      const items = (orderItems || [])
        .filter((i) => i.order_id === o.id)
        .map((i: any) => ({
          name: i.item?.name || "Unknown",
          quantity: toNumber(i.quantity),
          price: toNumber(i.price),
          total: toNumber(i.quantity) * toNumber(i.price),
        }));

      return {
        id: o.id,
        customer_name:
          customerMap.get(o.client_id)?.name || `Customer ${o.client_id}`,
        order_date: o.date,
        amount: toNumber(o.total),
        payment_amount: toNumber(o.payment_amount),
        payment_status: o.payment_status,
        balance_due: toNumber(o.balance_due),
        items_count: items.length,
        items,
      };
    });

    const total_sales = payloadOrders.reduce((sum, o) => sum + o.amount, 0);
    const total_paid = payloadOrders.reduce(
      (sum, o) => sum + o.payment_amount,
      0,
    );
    const total_due = payloadOrders.reduce((sum, o) => sum + o.balance_due, 0);

    const dayMap = new Map<string, any[]>();
    for (const order of payloadOrders) {
      const key = order.order_date;
      const list = dayMap.get(key) || [];
      list.push(order);
      dayMap.set(key, list);
    }

    const daily_breakdown = Array.from(dayMap.entries())
      .map(([dateKey, dayOrders]) => ({
        date: dateKey,
        total_sales: dayOrders.reduce((sum, d) => sum + d.amount, 0),
        order_count: dayOrders.length,
        orders: dayOrders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let customer_filter: string | null = null;
    let customer_balance: number | null = null;

    if (customer) {
      const selected = customerMap.get(Number(customer));
      customer_filter = selected?.name || `Customer ID: ${customer}`;
      customer_balance = selected ? toNumber(selected.balance) : null;
    }

    return {
      data: {
        start_date: startDate,
        end_date: endDate,
        total_sales,
        total_paid,
        total_due,
        order_count: payloadOrders.length,
        orders: payloadOrders,
        daily_breakdown,
        customer_filter,
        customer_balance,
      },
    };
  }

  throw createApiError(`Unsupported GET endpoint: ${url}`, 404);
};

export const apiPost = async (
  url: string,
  data: any,
): Promise<ApiResponse<any>> => {
  const supabase = createClient();

  if (url === "auth/token/") {
    const loginEmail = normalizeToSupabaseEmail(data.username);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: data.password,
    });

    if (error || !authData.session) {
      throw createApiError(
        error?.message || "Invalid username or password",
        401,
        error,
      );
    }

    setTokens(authData.session.access_token, authData.session.refresh_token);

    return {
      data: {
        access: authData.session.access_token,
        refresh: authData.session.refresh_token,
      },
    };
  }

  if (url === "customers/") {
    const payload = {
      name: data.name,
      balance: toNumber(data.starting_balance || 0),
    };

    const { data: inserted, error } = await supabase
      .from("client")
      .insert(payload)
      .select("id, name, balance")
      .single();

    if (error) throw createApiError(error.message, 400, error);

    return {
      data: {
        id: inserted.id,
        name: inserted.name,
        balance: toNumber(inserted.balance),
        starting_balance: toNumber(inserted.balance),
      },
    };
  }

  if (url === "sales/orders/create/") {
    const rpcPayload = {
      p_customer: Number(data.customer),
      p_items: data.items,
      p_payment_amount: toNumber(data.payment_amount || 0),
      p_payment_method: data.payment_method || "cash",
      p_payment_status: data.payment_status || "unpaid",
      p_total_amount: toNumber(data.total_amount || 0),
      p_balance_due: toNumber(data.balance_due || 0),
      p_date: data.date || formatDate(new Date()),
    };

    const { data: orderData, error } = await supabase.rpc(
      "create_order_with_receipt",
      rpcPayload,
    );

    if (error) throw createApiError(error.message, 400, error);

    return { data: orderData };
  }

  if (/^sales\/receipts\/\d+\/reprint\/$/.test(url)) {
    const receiptId = Number(
      url.split("sales/receipts/")[1].replace("/reprint/", ""),
    );

    const { data: current, error: getError } = await supabase
      .from("receipts")
      .select("id, reprint_count")
      .eq("id", receiptId)
      .single();

    if (getError) throw createApiError(getError.message, 404, getError);

    const { data: updated, error } = await supabase
      .from("receipts")
      .update({
        reprint_count: Number(current.reprint_count || 0) + 1,
        last_reprinted_at: new Date().toISOString(),
      })
      .eq("id", receiptId)
      .select("reprint_count, last_reprinted_at")
      .single();

    if (error) throw createApiError(error.message, 400, error);

    return {
      data: {
        message: "Receipt reprinted successfully",
        reprint_count: updated.reprint_count,
        last_reprinted_at: updated.last_reprinted_at,
      },
    };
  }

  throw createApiError(`Unsupported POST endpoint: ${url}`, 404);
};

export const apiPut = async (
  url: string,
  data: any,
): Promise<ApiResponse<any>> => {
  throw createApiError(`Unsupported PUT endpoint: ${url}`, 404, data);
};

export const apiPatch = async (
  url: string,
  data: any,
): Promise<ApiResponse<any>> => {
  const supabase = createClient();

  const match = url.match(/^pricing\/products\/(\d+)\/update-price\/$/);
  if (match) {
    const id = Number(match[1]);
    const { data: updated, error } = await supabase
      .from("item")
      .update({ price: toNumber(data.price) })
      .eq("id", id)
      .select("id, name, price")
      .single();

    if (error) throw createApiError(error.message, 400, error);

    return {
      data: {
        id: updated.id,
        product: updated.id,
        product_name: updated.name,
        name: updated.name,
        price: toNumber(updated.price),
      },
    };
  }

  throw createApiError(`Unsupported PATCH endpoint: ${url}`, 404);
};

export const apiDelete = async (url: string): Promise<ApiResponse<any>> => {
  throw createApiError(`Unsupported DELETE endpoint: ${url}`, 404);
};

export const login = async (username: string, password: string) => {
  const res = await apiPost("auth/token/", {
    username,
    password,
  });
  return res.data;
};

export const logout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  clearTokens();
};

export const getReceiptByOrderId = (orderId: number | string) =>
  apiGet(`sales/receipts/by-order/${orderId}/`);

export const getReceipt = (receiptId: number | string) =>
  apiGet(`sales/receipts/${receiptId}/`);

export const reprintReceipt = (receiptId: number | string) =>
  apiPost(`sales/receipts/${receiptId}/reprint/`, {});

export const getReceiptsByCustomer = (
  customerId: number | string,
  startDate?: string,
  endDate?: string,
) => {
  let url = `sales/receipts/?customer=${customerId}`;
  if (startDate && endDate) {
    url += `&start_date=${startDate}&end_date=${endDate}`;
  }
  return apiGet(url);
};

export const checkAuthStatus = async () => {
  try {
    const token = getAccessToken();
    if (!token) return { isAuthenticated: false, message: "No token found" };
    const response = await apiGet("auth/verify/");
    return {
      isAuthenticated: true,
      message: "Authenticated",
      user: response.data,
    };
  } catch (error: any) {
    return {
      isAuthenticated: false,
      message: error.response?.data?.detail || "Authentication failed",
    };
  }
};

export const getApiBaseUrl = () => BASE_URL;
export default {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
};

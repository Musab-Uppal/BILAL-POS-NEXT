import React, { useState } from "react";
import { getReceiptByOrderId } from "../../lib/api";
import {
  buildReportReceiptSnapshot,
  normalizeReceiptLookupResult,
} from "../../lib/receipt";

const getPaymentStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "partial":
      return "bg-yellow-100 text-yellow-800";
    case "unpaid":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OrderDetailReport({
  orders = [],
  reportType = "daily",
  customerName,
  customerBalance,
  showBalance = true,
}) {
  const [printingOrders, setPrintingOrders] = useState({});
  const [expandedOrder, setExpandedOrder] = useState(null);

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const safeOrders = Array.isArray(orders) ? orders : [];

  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const totalAmount = safeOrders.reduce(
    (sum, order) => sum + (parseFloat(order?.total || order?.amount) || 0),
    0,
  );

  const totalItems = safeOrders.reduce(
    (sum, order) => sum + (parseInt(order?.items_count, 10) || 0),
    0,
  );

  const handlePrintReceipt = async (order) => {
    if (!order?.id) return;

    const orderId = order.id;
    setPrintingOrders((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await getReceiptByOrderId(orderId);
      const receipt = normalizeReceiptLookupResult(response.data);

      if (receipt?.id) {
        const receiptUrl = `/receipt?print=true&receiptId=${receipt.id}`;
        window.open(receiptUrl, "_blank", "noopener,noreferrer");
      } else {
        const receiptPayload = buildReportReceiptSnapshot({
          order,
          customerName,
          customerBalance: parseFloat(customerBalance) || 0,
        });

        const encodedPayload = btoa(
          encodeURIComponent(JSON.stringify(receiptPayload)),
        );
        const receiptUrl = `/receipt?print=true&data=${encodedPayload}&orderId=${order.id}`;
        window.open(receiptUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      try {
        const receiptPayload = buildReportReceiptSnapshot({
          order,
          customerName,
          customerBalance: parseFloat(customerBalance) || 0,
        });

        const encodedPayload = btoa(
          encodeURIComponent(JSON.stringify(receiptPayload)),
        );
        const receiptUrl = `/receipt?print=true&data=${encodedPayload}&orderId=${order.id}`;
        window.open(receiptUrl, "_blank", "noopener,noreferrer");
      } catch {
        alert("Failed to generate receipt. Please try again.");
      }
    } finally {
      setPrintingOrders((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
            {reportType === "daily"
              ? "Daily"
              : reportType === "monthly"
                ? "Monthly"
                : "Date Range"}{" "}
            Orders
          </h3>
          {customerName && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Customer: <span className="font-semibold">{customerName}</span>
            </p>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {safeOrders.length} {safeOrders.length === 1 ? "order" : "orders"}
        </div>
      </div>

      {showBalance &&
        customerBalance !== undefined &&
        customerBalance !== null && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Customer Balance
                </p>
                <p
                  className={`text-xl sm:text-2xl font-bold ${parseFloat(customerBalance) > 0 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatCurrency(customerBalance)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Orders Amount
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-800">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
            Total Orders
          </p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {safeOrders.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
            Total Amount
          </p>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(totalAmount)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">
            Total Items
          </p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {totalItems}
          </p>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {safeOrders.length > 0 ? (
            safeOrders.map((order, index) => {
              const orderId = order?.id || `order-${index}`;
              const items = Array.isArray(order?.items) ? order.items : [];
              const isPrinting = printingOrders[orderId];
              const isExpanded = expandedOrder === orderId;

              return (
                <div
                  key={orderId}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold text-gray-800 mb-1">
                        #{orderId}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(order?.date || order?.order_date)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : orderId)
                      }
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Customer:</span>
                      <span className="text-sm font-medium">
                        {order?.customer_name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="font-bold">
                        {formatCurrency(order?.total || order?.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Items:</span>
                      <span className="text-sm">
                        {items.length || order?.items_count || 0} items
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${getPaymentStatusClass(order?.payment_status)}`}
                      >
                        {order?.payment_status || "paid"}
                      </span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Paid:</span>
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(order?.payment_amount || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Balance Due:
                          </span>
                          <span
                            className={`text-sm font-semibold ${(parseFloat(order?.balance_due) || 0) > 0 ? "text-red-600" : "text-green-600"}`}
                          >
                            {formatCurrency(order?.balance_due || 0)}
                          </span>
                        </div>

                        {items.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Items:
                            </p>
                            <div className="space-y-2">
                              {items.slice(0, 3).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-700 truncate">
                                    {item?.name || "Item"}
                                  </span>
                                  <span className="text-gray-600">
                                    {item?.quantity || 0} ×{" "}
                                    {formatCurrency(item?.price)}
                                  </span>
                                </div>
                              ))}
                              {items.length > 3 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ... and {items.length - 3} more items
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handlePrintReceipt(order)}
                          disabled={isPrinting}
                          className={`w-full mt-3 px-3 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${isPrinting ? "opacity-50" : ""}`}
                        >
                          {isPrinting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Printing...
                            </>
                          ) : (
                            <>Print Receipt</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500 text-sm">
                No orders match the selected criteria.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          {safeOrders.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-purple-100">
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Order ID
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Customer
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Date
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Items
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {safeOrders.map((order, index) => {
                  const orderId = order?.id || `order-${index}`;
                  const items = Array.isArray(order?.items) ? order.items : [];
                  const isPrinting = printingOrders[orderId];

                  return (
                    <tr
                      key={orderId}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-gray-800 text-sm">
                          #{orderId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800 text-sm">
                          {order?.customer_name || order?.client?.name || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700 text-sm">
                          {formatDate(order?.date || order?.order_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {order?.items_count || items.length || 0} items
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 text-sm">
                          {formatCurrency(order?.total || order?.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${getPaymentStatusClass(order?.payment_status)}`}
                        >
                          {order?.payment_status || "paid"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handlePrintReceipt(order)}
                          disabled={isPrinting}
                          className={`px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-colors flex items-center gap-1 ${isPrinting ? "opacity-50" : ""}`}
                          title="Print Receipt"
                          type="button"
                        >
                          {isPrinting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Printing...</span>
                            </>
                          ) : (
                            <span>Print</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-purple-200">
                  <td
                    colSpan="4"
                    className="py-4 px-4 text-lg font-bold text-gray-900"
                  >
                    Total ({safeOrders.length} orders)
                  </td>
                  <td className="py-4 px-4" colSpan="3">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatCurrency(totalAmount)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No orders found
              </h3>
              <p className="text-gray-500 text-sm">
                No orders match the selected criteria.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

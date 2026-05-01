import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import OrderDetailReport from "./OrderDetailReport";

export default function MonthlyReport({ reports }) {
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);



  // Check if reports is valid
  if (!reports) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Data Received</h3>
        <p className="text-gray-500">No monthly report data available.</p>
      </div>
    );
  }

  // Check if reports is an object with reports array (from backend)
  const isNewFormat = reports && reports.reports;
  const reportsArray = isNewFormat ? reports.reports : (Array.isArray(reports) ? reports : []);
  const customerFilter = isNewFormat ? reports.customer_filter : null;
  const customerBalance = isNewFormat ? reports.customer_balance : null;



  // If no reports data
  if (!reportsArray || reportsArray.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Monthly Data Found</h3>
        <p className="text-gray-500">No monthly report data available for the selected period.</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Rs 0.00";
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatMonth = (monthString) => {
    if (!monthString) return "N/A";

    try {
      const [year, month] = monthString.split("-");
      const date = new Date(year, parseInt(month) - 1);
      if (isMobile) {
        return date.toLocaleDateString("en-US", {
          year: '2-digit',
          month: "short",
        });
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
    } catch {
      return monthString;
    }
  };

  // Calculate total
  const totalSales = reportsArray.reduce(
    (sum, report) => sum + (parseFloat(report?.total_sales) || 0),
    0
  );

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (reportsArray.length < 2) return 0;
    const current = parseFloat(reportsArray[0]?.total_sales) || 0;
    const previous = parseFloat(reportsArray[1]?.total_sales) || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const growth = calculateGrowth();

  const toggleMonthExpansion = (monthIndex) => {
    setExpandedMonth(expandedMonth === monthIndex ? null : monthIndex);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Header */}
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
          Monthly Sales Report
        </h3>
        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
          {reportsArray.length} month{reportsArray.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Customer Balance Summary */}
      {customerFilter &&
        customerBalance !== undefined &&
        customerBalance !== null && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-base sm:text-lg font-bold">₹</span>
                </div>
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
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Filtered by:{" "}
                  <span className="font-semibold">{customerFilter}</span>
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Months</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            {reportsArray.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Total Sales</p>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {formatCurrency(totalSales)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2">Growth</p>
          <div className="flex items-center gap-2">
            {growth >= 0 ? (
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            )}
            <span
              className={`text-lg sm:text-xl font-bold ${growth >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {growth.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Monthly Data - Table on desktop, Cards on mobile */}
      {isMobile ? (
        /* Mobile Card Layout */
        <div className="space-y-3">
          {reportsArray.map((report, index) => {
            const isExpanded = expandedMonth === index;
            const month = report?.month || `Month ${index + 1}`;
            const totalSales = parseFloat(report?.total_sales) || 0;
            const orderCount = parseInt(report?.order_count) || 0;
            const orders = report?.orders || [];

            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-800">
                      {formatMonth(month)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleMonthExpansion(index)}
                    className="p-1 hover:bg-gray-100 rounded"
                    disabled={orders.length === 0}
                  >
                    {orders.length > 0 ? (
                      isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )
                    ) : (
                      <span className="text-xs text-gray-400">No Orders</span>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Sales</p>
                    <p className="font-bold text-sm">{formatCurrency(totalSales)}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Orders</p>
                    <p className="font-bold text-sm">{orderCount}</p>
                  </div>
                </div>

                {isExpanded && orders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <OrderDetailReport
                      orders={orders}
                      reportType="monthly"
                      date={month}
                      customerName={customerFilter}
                      customerBalance={customerBalance}
                      showBalance={false}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Total Summary for Mobile */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 mt-4">
            <div className="flex justify-between items-center">
              <p className="font-bold text-gray-900">Grand Total</p>
              <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(totalSales)}
              </p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {reportsArray.reduce((sum, report) => sum + (parseInt(report?.order_count) || 0), 0)} total orders
            </p>
          </div>
        </div>
      ) : (
        /* Desktop Table Layout */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-purple-100">
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Month
                </th>
                <th className="py-3 px-4 text-right text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Total Sales
                </th>
                <th className="py-3 px-4 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Orders
                </th>
                <th className="py-3 px-4 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reportsArray.map((report, index) => {
                const month = report?.month || `Month ${index + 1}`;
                const totalSales = parseFloat(report?.total_sales) || 0;
                const orderCount = parseInt(report?.order_count) || 0;
                const orders = report?.orders || [];

                return (
                  <React.Fragment key={index}>
                    <tr className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          <span className="font-medium text-gray-800 text-sm">
                            {formatMonth(month)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-gray-900 text-sm">
                          {formatCurrency(totalSales)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-gray-700 text-sm">
                          {orderCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {orders.length > 0 ? (
                          <button
                            onClick={() => toggleMonthExpansion(index)}
                            className="p-1 hover:bg-purple-100 rounded text-xs text-purple-600"
                          >
                            {expandedMonth === index ? (
                              <>
                                <ChevronUp className="w-3 h-3 inline mr-1" />
                                Hide Orders
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3 inline mr-1" />
                                Show Orders
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Orders</span>
                        )}
                      </td>
                    </tr>
                    {/* Expanded Row with Order Details */}
                    {expandedMonth === index && orders.length > 0 && (
                      <tr>
                        <td colSpan="4" className="p-0">
                          <div className="p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
                            <OrderDetailReport
                              orders={orders}
                              reportType="monthly"
                              date={month}
                              customerName={customerFilter}
                              customerBalance={customerBalance}
                              showBalance={false}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-t-2 border-purple-200">
                <td className="py-4 px-4 text-base sm:text-lg font-bold text-gray-900">
                  Grand Total
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatCurrency(totalSales)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    {reportsArray.reduce((sum, report) => sum + (parseInt(report?.order_count) || 0), 0)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Chart Visualization */}
      <div className="mt-6 sm:mt-8">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
          Sales Trend
        </h4>
        <div className="h-32 sm:h-48 flex items-end gap-1 sm:gap-2 px-2">
          {reportsArray.slice(0, 6).map((report, index) => {
            const maxValue = Math.max(
              ...reportsArray.map((r) => parseFloat(r?.total_sales) || 0)
            );
            const height =
              maxValue > 0 ? ((parseFloat(report?.total_sales) || 0) / maxValue) * 100 : 0;
            const month = report?.month || `M${index + 1}`;

            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-500"
                  style={{ height: `${height}%` }}
                  title={`${formatCurrency(parseFloat(report?.total_sales) || 0)} - ${month}`}
                ></div>
                <div className="mt-1 sm:mt-2 text-xs text-gray-600 font-medium">
                  {month.split("-")[1] || `M${index + 1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
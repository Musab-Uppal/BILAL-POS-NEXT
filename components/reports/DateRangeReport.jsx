import React, { useState } from "react";
import {
  Calendar,
  FileText,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import OrderDetailReport from "./OrderDetailReport";

export default function DateRangeReport({ report }) {
  const [expandedDay, setExpandedDay] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateAverage = () => {
    if (report.daily_breakdown.length === 0) return 0;
    return report.total_sales / report.daily_breakdown.length;
  };

  const averageDaily = calculateAverage();

  const toggleDayExpansion = (dayIndex) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
          Date Range Report
        </h3>
      </div>

      {/* Customer Balance Summary */}
      {report.customer_filter &&
        report.customer_balance !== undefined &&
        report.customer_balance !== null && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Customer Balance
                  </p>
                  <p
                    className={`text-lg sm:text-2xl font-bold ${
                      report.customer_balance > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formatCurrency(report.customer_balance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Filtered by:{" "}
                    <span className="font-semibold">
                      {report.customer_filter}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Date Range Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100 mb-4 sm:mb-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              Start
            </p>
            <p className="text-sm sm:text-lg font-semibold text-gray-800">
              {formatDate(report.start_date)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              End
            </p>
            <p className="text-sm sm:text-lg font-semibold text-gray-800">
              {formatDate(report.end_date)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
              Days
            </p>
            <p className="text-sm sm:text-lg font-semibold text-gray-800">
              {report.daily_breakdown.length}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Total Sales
              </p>
              <p className="text-base sm:text-xl font-bold text-purple-600">
                {formatCurrency(report.total_sales)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Total Orders
              </p>
              <p className="text-base sm:text-xl font-bold text-gray-800">
                {report.order_count}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Avg Daily
              </p>
              <p className="text-base sm:text-xl font-bold text-blue-600">
                {formatCurrency(averageDaily)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 border border-purple-100 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Active Days
              </p>
              <p className="text-base sm:text-xl font-bold text-green-600">
                {
                  report.daily_breakdown.filter((day) => day.total_sales > 0)
                    .length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Filter Info */}
      {report.customer_filter && (
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-blue-800">
            <span className="font-semibold">Filtered by customer:</span>{" "}
            {report.customer_filter}
          </p>
        </div>
      )}

      {/* Daily Breakdown - Mobile Card View */}
      <div className="sm:hidden">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          Daily Breakdown
        </h4>
        <div className="space-y-3">
          {report.daily_breakdown.map((day, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {formatDate(day.date)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleDayExpansion(index)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedDay === index ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Sales</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(day.total_sales)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Orders</p>
                    <p className="font-semibold">{day.order_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedDay === index && day.orders && day.orders.length > 0 && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <OrderDetailReport
                    orders={day.orders}
                    reportType="range"
                    date={day.date}
                    customerName={report.customer_filter}
                    customerBalance={report.customer_balance}
                    showBalance={false}
                    isMobile={true}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Daily Breakdown - Desktop Table View */}
      <div className="hidden sm:block">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-purple-100">
                <th className="py-3 px-4 text-left text-sm font-bold text-gray-700">
                  Date
                </th>
                <th className="py-3 px-4 text-right text-sm font-bold text-gray-700">
                  Sales
                </th>
                <th className="py-3 px-4 text-center text-sm font-bold text-gray-700">
                  Orders
                </th>
                <th className="py-3 px-4 text-center text-sm font-bold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {report.daily_breakdown.map((day, index) => (
                <React.Fragment key={index}>
                  <tr className="border-b border-gray-100 hover:bg-purple-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {formatDate(day.date)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(day.total_sales)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">
                        {day.order_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {day.orders && day.orders.length > 0 && (
                        <button
                          onClick={() => toggleDayExpansion(index)}
                          className="px-3 py-1.5 hover:bg-purple-100 rounded-lg text-sm text-purple-600 font-medium"
                        >
                          {expandedDay === index ? (
                            <>
                              <ChevronUp className="w-4 h-4 inline mr-1" />
                              Hide Orders
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 inline mr-1" />
                              Show Orders
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedDay === index &&
                    day.orders &&
                    day.orders.length > 0 && (
                      <tr>
                        <td colSpan="4" className="p-0">
                          <div className="p-6 bg-gray-50 border-b border-gray-200">
                            <OrderDetailReport
                              orders={day.orders}
                              reportType="range"
                              date={day.date}
                              customerName={report.customer_filter}
                              customerBalance={report.customer_balance}
                              showBalance={false}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Orders Summary */}
      {report.orders && report.orders.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <OrderDetailReport
            orders={report.orders}
            reportType="range"
            date={`${report.start_date} to ${report.end_date}`}
            customerName={report.customer_filter}
            customerBalance={report.customer_balance}
            isMobile={
              typeof window !== "undefined" ? window.innerWidth < 640 : false
            }
          />
        </div>
      )}

      {/* Summary */}
      {report.daily_breakdown.length > 0 && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <p className="text-xs sm:text-sm text-green-800">
            <span className="font-bold">{report.daily_breakdown.length}</span>{" "}
            days analyzed.
            {report.daily_breakdown.filter((day) => day.total_sales > 0)
              .length > 0 && (
              <span>
                {" "}
                Sales on{" "}
                {
                  report.daily_breakdown.filter((day) => day.total_sales > 0)
                    .length
                }{" "}
                days.
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

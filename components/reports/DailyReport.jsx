import React from "react";
import { Calendar, FileText, TrendingUp, DollarSign } from "lucide-react";
import OrderDetailReport from "./OrderDetailReport";

export default function DailyReport({ report }) {
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
          Daily Sales Report
        </h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Date
              </p>
              <p className="text-sm sm:text-lg font-semibold text-gray-800">
                {formatDate(report.date)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Total Sales
              </p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {formatCurrency(report.total_sales)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Orders
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-800">
                {report.order_count}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Filter Info */}
      {report.customer_filter && (
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-200">
          <p className="text-xs sm:text-sm text-blue-800">
            <span className="font-semibold">Filtered by customer:</span>{" "}
            {report.customer_filter}
          </p>
        </div>
      )}

      {/* Growth Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-sm sm:text-base font-semibold text-green-800">
              Sales Performance
            </span>
          </div>
          <span className="text-sm sm:text-base text-green-700 font-bold">
            {report.total_sales > 0 ? "Active Sales Day" : "No Sales Recorded"}
          </span>
        </div>
      </div>

      {/* Order Details Section */}
      {report.orders && report.orders.length > 0 ? (
        <div className="mt-6 sm:mt-8">
          <OrderDetailReport
            orders={report.orders}
            reportType="daily"
            date={report.date}
            customerName={report.customer_filter}
            customerBalance={report.customer_balance}
            isMobile={
              typeof window !== "undefined" ? window.innerWidth < 640 : false
            }
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center border border-gray-200">
          <p className="text-gray-600">No orders found for this date.</p>
        </div>
      )}
    </div>
  );
}

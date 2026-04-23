import React from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  Layers,
  CreditCard,
} from "lucide-react";

export default function ReportSummary({
  dailyReport,
  monthlyReport,
  rangeReport,
}) {
  const formatCurrency = (amount) => {
    if (!amount) return "Rs 0.00";
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

  // Calculate totals
  const monthlyTotal = monthlyReport && monthlyReport.reports 
    ? monthlyReport.reports.reduce((sum, report) => sum + (report.total_sales || 0), 0)
    : monthlyReport?.reduce((sum, report) => sum + (report.total_sales || 0), 0) || 0;
  
  const rangeTotal = rangeReport ? rangeReport.total_sales : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Reports Summary</h3>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {dailyReport && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Daily Report
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {formatDate(dailyReport.date)}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {formatCurrency(dailyReport.total_sales)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {dailyReport.order_count} orders
              </p>
              {dailyReport.customer_balance !== undefined && dailyReport.customer_balance !== null && (
                <div className="flex items-center gap-1 mt-2">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className={`text-xs font-medium ${dailyReport.customer_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Balance: {formatCurrency(dailyReport.customer_balance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {monthlyReport && (monthlyReport.reports || monthlyReport)?.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-5 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Monthly Report
                </p>
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {(monthlyReport.reports || monthlyReport).length} months
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {formatCurrency(monthlyTotal)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Total across all months
              </p>
              {monthlyReport.customer_balance !== undefined && monthlyReport.customer_balance !== null && (
                <div className="flex items-center gap-1 mt-2">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className={`text-xs font-medium ${monthlyReport.customer_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Balance: {formatCurrency(monthlyReport.customer_balance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {rangeReport && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-5 border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Date Range</p>
                <p className="text-sm sm:text-base font-semibold text-gray-800">
                  {rangeReport.daily_breakdown?.length || 0} days
                </p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(rangeTotal)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {rangeReport.order_count} orders
              </p>
              {rangeReport.customer_balance !== undefined && rangeReport.customer_balance !== null && (
                <div className="flex items-center gap-1 mt-2">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                  <span className={`text-xs font-medium ${rangeReport.customer_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Balance: {formatCurrency(rangeReport.customer_balance)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
          Quick Insights
        </h4>
        <div className="space-y-2 sm:space-y-3">
          {dailyReport && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold">Today's Sales:</span>{" "}
                  {formatCurrency(dailyReport.total_sales)} from{" "}
                  {dailyReport.order_count} orders
                </p>
                {dailyReport.orders && dailyReport.orders.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Includes {dailyReport.orders.length} detailed orders
                  </p>
                )}
              </div>
            </div>
          )}

          {monthlyReport && (monthlyReport.reports || monthlyReport)?.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold">Monthly Analysis:</span>{" "}
                  {(monthlyReport.reports || monthlyReport).length} months tracked with total sales of{" "}
                  {formatCurrency(monthlyTotal)}
                </p>
                {monthlyReport.reports && monthlyReport.reports.some(r => r.orders) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Click on months to view detailed orders
                  </p>
                )}
              </div>
            </div>
          )}

          {rangeReport && (
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Layers className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-gray-700">
                  <span className="font-semibold">Date Range:</span>{" "}
                  {rangeReport.daily_breakdown?.length || 0} days analyzed with{" "}
                  {rangeReport.order_count} orders
                </p>
                {rangeReport.orders && (
                  <p className="text-xs text-gray-500 mt-1">
                    Includes {rangeReport.orders.length} detailed orders
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
            <p className="text-xs sm:text-sm text-gray-700">
              <span className="font-semibold">Tip:</span> Click on the tabs
              above to view detailed reports or generate new ones using the
              filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import {
  Filter,
  RefreshCw,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ReportFilters({
  filters,
  customers,
  onFilterChange,
  onGenerate,
  onClear,
  loading,
}) {
  const [expanded, setExpanded] = React.useState(true);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setExpanded(false); // Collapse by default on mobile
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-3 sm:p-4 md:p-6 h-fit sticky top-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-800">Filters</h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-purple-50 rounded-lg"
          aria-label={expanded ? "Collapse filters" : "Expand filters"}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 sm:space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              Report Type
            </label>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {["daily", "range"].map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterChange("reportType", type)}
                  className={`py-2 px-1 sm:px-2 md:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    filters.reportType === type
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type === "daily" ? "Daily" : type === "monthly" ? "Monthly" : "Range"}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
              Customer
            </label>
            <select
              value={filters.selectedCustomer}
              onChange={(e) =>
                onFilterChange("selectedCustomer", e.target.value)
              }
              className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filters based on report type */}
          {filters.reportType === "daily" && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={filters.dailyDate}
                onChange={(e) => onFilterChange("dailyDate", e.target.value)}
                className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
              />
            </div>
          )}

          {(filters.reportType === "monthly" || filters.reportType === "range") && (
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'}`}>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={
                    filters.reportType === "monthly"
                      ? filters.monthlyStartDate
                      : filters.rangeStartDate
                  }
                  onChange={(e) =>
                    onFilterChange(
                      filters.reportType === "monthly"
                        ? "monthlyStartDate"
                        : "rangeStartDate",
                      e.target.value
                    )
                  }
                  className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={
                    filters.reportType === "monthly"
                      ? filters.monthlyEndDate
                      : filters.rangeEndDate
                  }
                  onChange={(e) =>
                    onFilterChange(
                      filters.reportType === "monthly"
                        ? "monthlyEndDate"
                        : "rangeEndDate",
                      e.target.value
                    )
                  }
                  className="w-full p-2 sm:p-2.5 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
            <button
              onClick={onGenerate}
              disabled={loading}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-70 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate Report"
              )}
            </button>

            <button
              onClick={onClear}
              className="w-full py-2 sm:py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { apiGet } from "../../lib/api";
import ReportHeader from "../../components/reports/ReportHeader";
import ReportFilters from "../../components/reports/ReportFilters";
import DailyReport from "../../components/reports/DailyReport";
//import MonthlyReport from "../../components/reports/MonthlyReport";
import DateRangeReport from "../../components/reports/DateRangeReport";
import ReportSummary from "../../components/reports/ReportSummary";
import ReportEmptyState from "../../components/reports/ReportEmptyState";
import ReportLoading from "../../components/reports/ReportLoading";
import ReportError from "../../components/reports/ReportError";
import CustomerBalances from "../../components/reports/CustomerBalances";

export default function Report() {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfLastMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 1,
    1,
  );
  const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  const [filters, setFilters] = useState({
    reportType: "daily",
    selectedCustomer: "",
    dailyDate: today.toISOString().split("T")[0],
    monthlyStartDate: firstDayOfMonth.toISOString().split("T")[0],
    monthlyEndDate: today.toISOString().split("T")[0],
    rangeStartDate: firstDayOfLastMonth.toISOString().split("T")[0],
    rangeEndDate: lastDayOfLastMonth.toISOString().split("T")[0],
  });

  const [reportData, setReportData] = useState({
    daily: null,
    monthly: [],
    range: null,
  });

  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [authError, setAuthError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchCustomers();
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await apiGet("customers/");
      if (res && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {

      if (err.response?.status === 401) {
        setAuthError(true);
        setError("Your session has expired. Please log in again.");
      }
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setAuthError(false);

    try {
      if (filters.reportType === "daily") {
        await fetchDailyReport();
        //}
        // else if (filters.reportType === "monthly") {
        //   await fetchMonthlyReport();
      } else if (filters.reportType === "range") {
        await fetchDateRangeReport();
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const params = new URLSearchParams({
        date: filters.dailyDate,
      });

      if (filters.selectedCustomer) {
        params.append("customer", filters.selectedCustomer);
      }

      const res = await apiGet(`sales/orders/reports/daily/?${params}`);
      if (res && res.data) {
        setReportData((prev) => ({ ...prev, daily: res.data }));
        setActiveTab("daily");
      }
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };

  const fetchDateRangeReport = async () => {
    try {
      if (!filters.rangeStartDate || !filters.rangeEndDate) {
        setError(
          "Please select both start and end dates for date range report",
        );
        throw new Error("Please select both start and end dates");
      }

      const startDate = new Date(filters.rangeStartDate);
      const endDate = new Date(filters.rangeEndDate);
      if (endDate < startDate) {
        setError("End date cannot be before start date");
        throw new Error("End date cannot be before start date");
      }

      const params = new URLSearchParams({
        start_date: filters.rangeStartDate,
        end_date: filters.rangeEndDate,
      });

      if (filters.selectedCustomer) {
        params.append("customer", filters.selectedCustomer);
      }


      const res = await apiGet(`sales/orders/reports/date-range/?${params}`);
      if (res && res.data) {
        setReportData((prev) => ({ ...prev, range: res.data }));
        setActiveTab("range");
      }
    } catch (err) {
      handleApiError(err);
      throw err;
    }
  };

  const handleApiError = (err) => {


    if (err.response?.status === 401) {
      setAuthError(true);
      setError("Your session has expired. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } else if (err.response?.status === 400) {
      setError(
        err.response.data.error ||
          err.response.data.detail ||
          "Invalid request parameters",
      );
    } else if (err.response?.data?.detail) {
      setError(err.response.data.detail);
    } else if (err.response?.data?.error) {
      setError(err.response.data.error);
    } else if (err.message) {
      setError(err.message);
    } else {
      setError("Failed to fetch data. Please try again.");
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));

    if (name === "reportType") {
      const todayDate = new Date();

      if (value === "monthly") {
        const first = new Date(
          todayDate.getFullYear(),
          todayDate.getMonth(),
          1,
        );
        setFilters((prev) => ({
          ...prev,
          monthlyStartDate: first.toISOString().split("T")[0],
          monthlyEndDate: todayDate.toISOString().split("T")[0],
        }));
      } else if (value === "range") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(todayDate.getDate() - 30);
        setFilters((prev) => ({
          ...prev,
          rangeStartDate: thirtyDaysAgo.toISOString().split("T")[0],
          rangeEndDate: todayDate.toISOString().split("T")[0],
        }));
      }
    }
  };

  const handleClearFilters = () => {
    const todayDate = new Date();
    const firstDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
    const firstDayLast = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth() - 1,
      1,
    );
    const lastDayLast = new Date(
      todayDate.getFullYear(),
      todayDate.getMonth(),
      0,
    );

    setFilters({
      reportType: "daily",
      selectedCustomer: "",
      dailyDate: todayDate.toISOString().split("T")[0],
      monthlyStartDate: firstDay.toISOString().split("T")[0],
      monthlyEndDate: todayDate.toISOString().split("T")[0],
      rangeStartDate: firstDayLast.toISOString().split("T")[0],
      rangeEndDate: lastDayLast.toISOString().split("T")[0],
    });
    setReportData({ daily: null, monthly: [], range: null });
    setActiveTab("summary");
    setError(null);
    setAuthError(false);
  };

  const handleLoginRedirect = () => {
    window.location.href = "/login";
  };

  const hasReportData =
    reportData.daily || reportData.monthly.length > 0 || reportData.range;

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-3 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center w-full">
          <ReportHeader />
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 sm:p-8 mt-4 sm:mt-6 mx-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span className="text-xl sm:text-2xl">🔒</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
              Authentication Required
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">
              {error || "Please log in to access the reports dashboard"}
            </p>
            <button
              onClick={handleLoginRedirect}
              className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <ReportHeader />

        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, reportType: "daily" }));
              setTimeout(() => generateReport(), 100);
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
          >
            Today's Report
          </button>

          <button
            onClick={() => setActiveTab("balances")}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
          >
            View Balances
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="lg:col-span-1 order-1 lg:order-1">
            <ReportFilters
              filters={filters}
              customers={customers}
              onFilterChange={handleFilterChange}
              onGenerate={generateReport}
              onClear={handleClearFilters}
              loading={loading}
            />
          </div>

          <div className="lg:col-span-3 order-2 lg:order-2">
            {loading && <ReportLoading />}

            {error && !loading && (
              <ReportError error={error} onDismiss={() => setError(null)} />
            )}

            {!loading && !error && (
              <>
                <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-1 sm:mx-0 px-1 sm:px-0">
                  <TabButton
                    active={activeTab === "summary"}
                    onClick={() => setActiveTab("summary")}
                    icon="📊"
                    label="Summary"
                    isMobile={isMobile}
                  />
                  <TabButton
                    active={activeTab === "balances"}
                    onClick={() => setActiveTab("balances")}
                    icon="💰"
                    label="Balances"
                    isMobile={isMobile}
                  />
                  {reportData.daily && (
                    <TabButton
                      active={activeTab === "daily"}
                      onClick={() => setActiveTab("daily")}
                      icon="📅"
                      label="Daily"
                      isMobile={isMobile}
                    />
                  )}
                  {reportData.monthly.length > 0 && (
                    <TabButton
                      active={activeTab === "monthly"}
                      onClick={() => setActiveTab("monthly")}
                      icon="📈"
                      label="Monthly"
                      isMobile={isMobile}
                    />
                  )}
                  {reportData.range && (
                    <TabButton
                      active={activeTab === "range"}
                      onClick={() => setActiveTab("range")}
                      icon="📋"
                      label="Range"
                      isMobile={isMobile}
                    />
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-3 sm:p-4 md:p-6">
                  {activeTab === "summary" && !hasReportData && (
                    <ReportEmptyState />
                  )}

                  {activeTab === "summary" && hasReportData && (
                    <ReportSummary
                      dailyReport={reportData.daily}
                      monthlyReport={reportData.monthly}
                      rangeReport={reportData.range}
                    />
                  )}

                  {activeTab === "balances" && <CustomerBalances />}

                  {activeTab === "daily" && reportData.daily && (
                    <DailyReport report={reportData.daily} />
                  )}

                  {/* {activeTab === "monthly" && reportData.monthly.length > 0 && (
                    <MonthlyReport reports={reportData.monthly} />
                  )} */}

                  {activeTab === "range" && reportData.range && (
                    <DateRangeReport report={reportData.range} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, isMobile }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
        active
          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
          : "bg-white text-gray-700 hover:bg-purple-50 border border-purple-100"
      }`}
    >
      <span className="text-sm sm:text-base">{icon}</span>
      <span className="text-xs sm:text-sm">
        {isMobile && label.length > 8 ? `${label.substring(0, 6)}..` : label}
      </span>
    </button>
  );
}

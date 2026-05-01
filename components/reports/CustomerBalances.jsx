import React, { useState, useEffect } from "react";
import { apiGet } from "../../lib/api";
import {
  Users,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Filter,
  SortAsc,
  SortDesc,
  UserCheck,
  UserX,
  UserMinus,
  Search,
  Menu,
  X,
} from "lucide-react";

export default function CustomerBalances() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balances, setBalances] = useState({
    customers: [],
    total_balance: 0,
    count: 0,
    positive_balance_count: 0,
    negative_balance_count: 0,
    zero_balance_count: 0,
  });
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);

  const fetchCustomerBalances = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sort: sortBy,
        order: sortOrder,
      });

      const res = await apiGet(`customers/balances/?${params}`);
      if (res && res.data) {
        setBalances(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load customer balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerBalances();
  }, [sortBy, sortOrder]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setShowMobileSort(false);
  };

  const handleFilter = (filterType) => {
    setFilter(filterType);
    setShowMobileFilters(false);
  };

  // Filter customers based on selected filter and search
  const filteredCustomers = balances.customers.filter((customer) => {
    // Apply filter
    if (filter === "positive" && customer.balance <= 0) return false;
    if (filter === "negative" && customer.balance >= 0) return false;
    if (filter === "zero" && customer.balance !== 0) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.id.toString().includes(query)
      );
    }

    return true;
  });

  // Calculate filtered totals
  const filteredTotal = filteredCustomers.reduce(
    (sum, customer) => sum + customer.balance,
    0,
  );
  const filteredCount = filteredCustomers.length;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-lg text-center border border-purple-100">
        <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-200 border-t-purple-600 mb-4"></div>
        <p className="text-gray-600 font-medium text-sm sm:text-base">
          Loading customer balances...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-linear-to-r from-red-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-red-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Users className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h4 className="font-semibold text-red-900 mb-1 text-sm sm:text-base">
              Error Loading Balances
            </h4>
            <p className="text-red-700 text-xs sm:text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
            Customer Balances
          </h3>
        </div>
        <div className="text-sm text-gray-600">{balances.count} customers</div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search customers by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Mobile Controls */}
      <div className="sm:hidden flex gap-2">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium"
        >
          <Filter className="w-4 h-4" />
          Filter
        </button>
        <button
          onClick={() => setShowMobileSort(!showMobileSort)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium"
        >
          {sortOrder === "asc" ? (
            <SortAsc className="w-4 h-4" />
          ) : (
            <SortDesc className="w-4 h-4" />
          )}
          Sort
        </button>
      </div>

      {/* Mobile Filter Panel */}
      {showMobileFilters && (
        <div className="sm:hidden bg-white rounded-xl p-4 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Filter by Balance</h4>
            <button
              onClick={() => setShowMobileFilters(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleFilter("all")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                filter === "all"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilter("positive")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                filter === "positive"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Debt
            </button>
            <button
              onClick={() => handleFilter("negative")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                filter === "negative"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Credit
            </button>
            <button
              onClick={() => handleFilter("zero")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                filter === "zero"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Zero
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sort Panel */}
      {showMobileSort && (
        <div className="sm:hidden bg-white rounded-xl p-4 border border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">Sort by</h4>
            <button
              onClick={() => setShowMobileSort(false)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => handleSort("name")}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                sortBy === "name"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Name
              {sortBy === "name" &&
                (sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                ))}
            </button>
            <button
              onClick={() => handleSort("balance")}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                sortBy === "balance"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Balance
              {sortBy === "balance" &&
                (sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                ))}
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-linear-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-5 border border-purple-100">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">
            Total Balance
          </p>
          <p className="text-sm sm:text-base font-bold truncate">
            {formatCurrency(balances.total_balance)}
          </p>
        </div>

        <div className="bg-linear-to-br from-red-50 to-orange-50 rounded-xl p-3 sm:p-5 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            <p className="text-xs sm:text-sm font-medium text-gray-600">Debt</p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-600">
            {balances.positive_balance_count}
          </p>
        </div>

        <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-5 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            <p className="text-xs sm:text-sm font-medium text-gray-600">
              Credit
            </p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            {balances.negative_balance_count}
          </p>
        </div>

        <div className="bg-linear-to-br from-gray-50 to-slate-50 rounded-xl p-3 sm:p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            <p className="text-xs sm:text-sm font-medium text-gray-600">Zero</p>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-600">
            {balances.zero_balance_count}
          </p>
        </div>
      </div>

      {/* Desktop Filter and Sort Controls */}
      <div className="hidden sm:block bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Filter by:
            </span>
            <button
              onClick={() => handleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({balances.count})
            </button>
            <button
              onClick={() => handleFilter("positive")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "positive"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Debt ({balances.positive_balance_count})
            </button>
            <button
              onClick={() => handleFilter("negative")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "negative"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Credit ({balances.negative_balance_count})
            </button>
            <button
              onClick={() => handleFilter("zero")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === "zero"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Zero ({balances.zero_balance_count})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <button
              onClick={() => handleSort("name")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                sortBy === "name"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Name
              {sortBy === "name" &&
                (sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                ))}
            </button>
            <button
              onClick={() => handleSort("balance")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                sortBy === "balance"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Balance
              {sortBy === "balance" &&
                (sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                ))}
            </button>
          </div>
        </div>
      </div>

      {/* Filtered Summary */}
      {filter !== "all" && (
        <div
          className={`p-3 sm:p-4 rounded-xl border ${
            filter === "positive"
              ? "bg-red-50 border-red-200 text-red-800"
              : filter === "negative"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-gray-50 border-gray-200 text-gray-800"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {filter === "positive" && <TrendingUp className="w-4 h-4" />}
              {filter === "negative" && <TrendingDown className="w-4 h-4" />}
              {filter === "zero" && <CreditCard className="w-4 h-4" />}
              <span className="font-semibold text-sm sm:text-base">
                Showing {filteredCount} {filter} balance{" "}
                {filteredCount === 1 ? "customer" : "customers"}
              </span>
            </div>
            <span className="font-bold text-sm sm:text-base">
              Total: {formatCurrency(filteredTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery && (
        <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
          <p className="text-sm text-blue-800">
            Found {filteredCount} customers matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Customer Balances Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[640px] sm:min-w-0">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Customer</span>
                    <span className="sm:hidden">Cust.</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right text-xs sm:text-sm font-bold text-gray-700">
                  <span className="hidden sm:inline">Balance</span>
                  <span className="sm:hidden">Bal.</span>
                </th>
                <th className="py-3 px-4 text-center text-xs sm:text-sm font-bold text-gray-700">
                  Orders
                </th>
                <th className="py-3 px-4 text-left text-xs sm:text-sm font-bold text-gray-700">
                  Last Order
                </th>
                <th className="py-3 px-4 text-center text-xs sm:text-sm font-bold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                          {customer.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {customer.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm sm:text-lg font-bold ${
                          customer.balance > 0
                            ? "text-red-600"
                            : customer.balance < 0
                              ? "text-green-600"
                              : "text-gray-600"
                        }`}
                      >
                        {formatCurrency(customer.balance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-gray-700">
                        {customer.order_count}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 text-xs sm:text-sm">
                        {formatDate(customer.last_order_date)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.balance > 0
                            ? "bg-red-100 text-red-800"
                            : customer.balance < 0
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.balance > 0
                          ? "In Debt"
                          : customer.balance < 0
                            ? "In Credit"
                            : "Paid Up"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 px-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <UserX className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium text-sm sm:text-base">
                        No customers found
                      </p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-1">
                        {searchQuery
                          ? `No customers match "${searchQuery}"`
                          : filter === "all"
                            ? "No customers in the system"
                            : `No customers with ${filter} balance`}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="py-3 px-4">
                  <span className="font-bold text-gray-800 text-sm sm:text-base">
                    Total ({filteredCount} customers)
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`text-lg sm:text-xl font-bold ${
                      filteredTotal > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {formatCurrency(filteredTotal)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="font-bold text-gray-800">
                    {filteredCustomers.reduce(
                      (sum, c) => sum + c.order_count,
                      0,
                    )}
                  </span>
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile-friendly list view for small screens */}
      <div className="sm:hidden">
        {filteredCustomers.length > 0 ? (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {customer.name}
                    </h4>
                    <p className="text-xs text-gray-500">ID: {customer.id}</p>
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      customer.balance > 0
                        ? "text-red-600"
                        : customer.balance < 0
                          ? "text-green-600"
                          : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(customer.balance)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      {customer.order_count} orders
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        customer.balance > 0
                          ? "bg-red-100 text-red-800"
                          : customer.balance < 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.balance > 0
                        ? "In Debt"
                        : customer.balance < 0
                          ? "In Credit"
                          : "Paid Up"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Last: {formatDate(customer.last_order_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Insights */}
      <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-xl p-4 sm:p-5 border border-purple-100">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
          Balance Insights
        </h4>
        <div className="space-y-2 sm:space-y-3">
          {balances.total_balance > 0 && (
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-red-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-700">
                <span className="font-semibold">Total Debt:</span> Customers owe
                a total of {formatCurrency(balances.total_balance)}.
              </p>
            </div>
          )}

          {balances.total_balance < 0 && (
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-green-50 rounded-lg">
              <TrendingDown className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-green-700">
                <span className="font-semibold">Total Credit:</span> Business
                owes {formatCurrency(Math.abs(balances.total_balance))}.
              </p>
            </div>
          )}

          {balances.positive_balance_count > 0 && (
            <div className="flex items-start gap-2 p-2 sm:p-3 bg-yellow-50 rounded-lg">
              <UserMinus className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-yellow-700">
                <span className="font-semibold">
                  {balances.positive_balance_count} customers in debt.
                </span>{" "}
                Consider payment reminders.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 p-2 sm:p-3 bg-blue-50 rounded-lg">
            <CreditCard className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-blue-700">
              <span className="font-semibold">Tip:</span> Monitor balances
              regularly for healthy cash flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

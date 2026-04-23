"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "../../lib/api";

export default function AddCustomer() {
  const [formData, setFormData] = useState({
    name: "",
    starting_balance: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Customer name is required");
      setLoading(false);
      return;
    }

    if (formData.starting_balance === "") {
      setError("Starting balance is required");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        starting_balance: parseFloat(formData.starting_balance),
      };

      const res = await apiPost("customers/", payload);

      if (res && res.data) {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "pos_navigation_state",
            JSON.stringify({
              message: "Customer added successfully!",
              newCustomerId: res.data.id,
            }),
          );
        }
        router.push("/pos");
      } else {
        setError("Failed to add customer. Please try again.");
      }
    } catch (err: any) {
      console.error("Error adding customer:", err);
      setError(
        err.response?.data?.message ||
          "Failed to add customer. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/pos");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add New Customer</h1>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Customer Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter customer name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="starting_balance"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Starting Balance *
            </label>
            <input
              type="number"
              id="starting_balance"
              name="starting_balance"
              value={formData.starting_balance}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the initial balance for this customer
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

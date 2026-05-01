"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "../../lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("unauthorized") === "1") {
      setError("Only admin can access this POS");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      window.location.href = "/pos";
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message =
        (err as { response?: { data?: { detail?: string; error?: string } } })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { detail?: string; error?: string } } })
          ?.response?.data?.error ||
        "Invalid username or password";

      if (status !== 401) {
        // Unexpected login error
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-1 min-h-full py-12">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg w-80 shadow-lg border border-gray-200"
      >
        <h2 className="m-0 mb-6 text-2xl font-bold text-gray-800 text-center">
          Sign In
        </h2>

        {error && (
          <p className="bg-red-50 px-3 py-3 rounded text-red-700 text-sm mb-4 border border-red-200">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none cursor-pointer font-semibold text-base hover:shadow-lg transition-shadow disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Logging in...</span>
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}

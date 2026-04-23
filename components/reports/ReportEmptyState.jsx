import React from "react";
import { BarChart3, TrendingUp } from "lucide-react";

export default function ReportEmptyState() {
  return (
    <div className="py-8 sm:py-12 text-center px-2">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
          No Reports Yet
        </h3>
        <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 px-2">
          Generate your first sales report to get started with analytics
        </p>
        <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
          <div className="flex items-start sm:items-center gap-3">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-0.5 sm:mt-0 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs sm:text-sm font-medium text-gray-800">How to start:</p>
              <p className="text-xs text-gray-600 mt-1">
                1. Select report type
                <br />
                2. Apply filters if needed
                <br />
                3. Click "Generate Report"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
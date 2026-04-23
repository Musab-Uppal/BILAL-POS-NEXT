import React from "react";

export default function ReportLoading() {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-lg text-center border border-purple-100 mx-2 sm:mx-0">
      <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-purple-200 border-t-purple-600 mb-3 sm:mb-4"></div>
      <p className="text-gray-600 font-medium text-sm sm:text-base">Generating report...</p>
      <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
        Please wait while we process your data
      </p>
    </div>
  );
}
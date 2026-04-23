import React from "react";
import { BarChart3 } from "lucide-react";

export default function ReportHeader() {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Sales Analytics
        </h1>
      </div>
      <p className="text-gray-600 text-sm sm:text-base ml-10 sm:ml-14">
        Generate detailed sales reports and analytics
      </p>
    </div>
  );
}
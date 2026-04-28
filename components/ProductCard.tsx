"use client";

import { useState, useTransition } from "react";
import { Plus, Edit } from "lucide-react";

export default function ProductCard({
  product,
  onAdd,
  onEdit,
}: {
  product: any;
  onAdd?: () => void;
  onEdit?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const safeProduct = product || {};
  const productId = safeProduct.productId || "";
  const productName = safeProduct.name || "Unknown Product";
  const productPrice =
    typeof safeProduct.price === "number" ? safeProduct.price : 0;

  const imageUrl = productId
    ? `/images/${productId}.png`
    : "/images/default.png";

  const handleImageError = () => {
    setImageError(true);
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (typeof onEdit === "function") {
      startTransition(() => {
        onEdit();
      });
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!(e.target as HTMLElement).closest(".edit-button")) {
      e.preventDefault();
      if (typeof onAdd === "function") {
        onAdd();
      }
    }
  };

  return (
    <div className="group relative bg-gradient-to-br from-white/95 to-purple-50/95 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-white/30 hover:shadow-xl sm:hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 w-full">
      {typeof onEdit === "function" && (
        <button
          onClick={handleEditClick}
          disabled={isPending}
          className="edit-button absolute top-1.5 sm:top-2 left-1.5 sm:left-2 z-10 p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-md sm:hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-blue-300"
          title="Edit Product"
          type="button"
          aria-label={`Edit ${productName}`}
          aria-busy={isPending}
        >
          {isPending ? (
            <span className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
          ) : (
            <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          )}
        </button>
      )}

      <button
        onClick={handleCardClick}
        className="w-full text-left focus:outline-none focus:ring-1 sm:focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!onAdd}
        type="button"
        aria-label={`Add ${productName} to cart`}
      >
        <div className="h-24 sm:h-28 bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
              onLoad={() => setImageError(false)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              aria-label={`No image available for ${productName}`}
            >
              <div
                className="text-3xl sm:text-4xl"
                role="img"
                aria-label="Product icon"
              >
                🥩
              </div>
            </div>
          )}

          {productPrice > 0 && (
            <div
              className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold shadow-md sm:shadow-lg"
              aria-label={`Price: Rs ${productPrice.toFixed(2)} per kilogram`}
            >
              Rs {productPrice.toFixed(2)}/kg
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 rounded-full p-1.5 sm:p-2 shadow-lg sm:shadow-xl">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="p-2">
          <h4
            className="font-bold text-gray-800 text-xs sm:text-sm mb-1 line-clamp-2 h-8"
            title={productName}
          >
            {productName}
          </h4>

          <div className="flex items-center justify-center py-0.5">
            <span className="text-xs text-gray-600 font-medium truncate">
              {typeof onAdd === "function"
                ? "Click to add to cart"
                : "Select a product"}
            </span>
          </div>
        </div>
      </button>

      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/10 transition-all duration-300 pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}

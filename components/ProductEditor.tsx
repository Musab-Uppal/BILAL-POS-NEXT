"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPatch } from "../lib/api";

export default function ProductEditor({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const SPECIAL_GROUP_IDS = [4, 6, 7, 5];
  const PERMANENTLY_EXCLUDED_IDS = [12];
  const currentIdNum = useMemo(() => Number(id), [id]);

  const isExcludedProduct = PERMANENTLY_EXCLUDED_IDS.includes(currentIdNum);
  const isSpecialProduct = SPECIAL_GROUP_IDS.includes(currentIdNum);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await apiGet(`pricing/products/`);
        if (res?.data) {
          setAllProducts(res.data);

          const foundProduct = res.data.find((p: any) => p.id === currentIdNum);
          if (foundProduct) {
            setProduct(foundProduct);
            setPrice(foundProduct.price?.toString() ?? "");
          } else {
            alert("Product not found");
            router.push("/pos");
          }
        }
      } catch (err) {
        console.error("Failed to load product", err);
        alert("Failed to load product");
        router.push("/pos");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [router, currentIdNum]);

  const getIdsToUpdate = () => {
    if (isExcludedProduct) {
      return [];
    }

    if (isSpecialProduct) {
      return [currentIdNum];
    }

    return allProducts
      .map((p) => p.id)
      .filter(
        (productId) =>
          !SPECIAL_GROUP_IDS.includes(productId) &&
          !PERMANENTLY_EXCLUDED_IDS.includes(productId),
      );
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price greater than 0");
      return;
    }

    if (isExcludedProduct) {
      alert("Price cannot be changed for this product");
      return;
    }

    setSaving(true);

    try {
      const idsToUpdate = getIdsToUpdate();

      if (idsToUpdate.length === 0) {
        alert("No products to update");
        return;
      }

      await updateProductPrices(idsToUpdate, priceNum);

      if (isSpecialProduct) {
        alert(`Price updated for product ID ${currentIdNum} only!`);
      } else {
        alert("All regular product prices updated successfully!");
      }

      router.push("/pos");
    } catch (err) {
      console.error("Failed to update price", err);
      alert("Failed to update price.");
    } finally {
      setSaving(false);
    }
  };

  const updateProductPrices = async (
    productIds: number[],
    newPrice: number,
  ) => {
    const updatePromises = productIds.map((productId) =>
      apiPatch(`pricing/products/${productId}/update-price/`, {
        price: newPrice,
      }),
    );
    return Promise.all(updatePromises);
  };

  if (loading) return <div className="p-5">Loading product...</div>;

  return (
    <div className="p-5">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {isExcludedProduct
          ? "View Product (Read-only)"
          : isSpecialProduct
            ? "Edit Special Product"
            : "Edit Product"}
      </h2>

      <div className="max-w-[520px] bg-white p-4 rounded-lg shadow-md">
        <div className="mb-3">
          <strong className="text-gray-700">Name:</strong>
          <div className="mt-1.5 text-gray-800">{product?.product_name}</div>
        </div>

        <div className="mb-3">
          <strong className="text-gray-700">Product ID:</strong>
          <div className="mt-1.5 text-gray-800">{currentIdNum}</div>
        </div>

        {isSpecialProduct && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-700 text-sm">
              ⚠️ <strong>Special Product:</strong> Price changes will only
              affect this product.
            </p>
          </div>
        )}

        {!isSpecialProduct && !isExcludedProduct && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-700 text-sm">
              ℹ️ <strong>Regular Product:</strong> Price changes will affect ALL
              regular products.
            </p>
          </div>
        )}

        <div className="mb-3">
          <label className="block mb-1.5 text-gray-700 font-medium">
            Price (Rs)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0.01"
            step="0.01"
            disabled={isExcludedProduct}
            className={`p-2 w-full rounded-md border ${
              isExcludedProduct ? "bg-gray-100" : ""
            } border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          />
          {isExcludedProduct ? (
            <p className="text-sm text-gray-500 mt-1">
              Price cannot be changed for this product
            </p>
          ) : isSpecialProduct ? (
            <p className="text-sm text-gray-500 mt-1">
              This price change will only affect this product
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              This price change will affect ALL regular products
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || isExcludedProduct}
            className="py-2 px-3.5 rounded-md bg-indigo-500 text-white border-none font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={
              isExcludedProduct
                ? "Price cannot be changed for this product"
                : ""
            }
          >
            {saving
              ? "Saving..."
              : isSpecialProduct
                ? "Save This Product"
                : "Save All Regular Products"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="py-2 px-3.5 rounded-md border border-gray-300 bg-white text-gray-700 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

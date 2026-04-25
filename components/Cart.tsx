"use client";

import { useState, useEffect } from "react";
import { useCart } from "../context/useCart";
import {
  ShoppingCart,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  DollarSign,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiPost } from "../lib/api";

function setNavigationState(state: unknown) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      "receipt_navigation_state",
      JSON.stringify(state),
    );
  }
}

export default function Cart() {
  const {
    cart,
    updateQuantity,
    updateFactor,
    removeFromCart,
    itemTotal,
    grandTotal,
    isCheckoutDisabled,
    currentCustomer,
    clearCart,
    clearCustomer,
    orderDate,
    setOrderDate,
  } = useCart();

  const [paymentAmount, setPaymentAmount] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCartOpen(true);
      } else {
        setIsCartOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePayment = async () => {
    if (isCheckoutDisabled()) {
      if (!currentCustomer) {
        alert("Please select a customer before payment");
      } else {
        alert("Cannot checkout: fix invalid items");
      }
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment < 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    setProcessingPayment(true);

    try {
      let payment_status = "partial";
      if (payment === 0) {
        payment_status = "unpaid";
      } else if (payment >= grandTotal) {
        payment_status = "paid";
      } else if (payment < grandTotal) {
        payment_status = "partial";
      }

      const balance_due = grandTotal - payment;

      const payload = {
        items: cart.map((it: any) => ({
          product: String(it.productId),
          quantity: String(Number(it.qty).toFixed(2)),
          factor: String(Number(it.factor || 1).toFixed(2)),
        })),
        customer: String(currentCustomer.id),
        payment_amount: String(parseFloat(paymentAmount || "0").toFixed(2)),
        payment_method: "cash",
        payment_status,
        total_amount: String(grandTotal.toFixed(2)),
        balance_due: String(
          Math.max(0, grandTotal - parseFloat(paymentAmount || "0")).toFixed(2),
        ),
        date: orderDate || new Date().toISOString().split("T")[0],
      };

      let backendOrder = null;

      try {
        const res = await apiPost("sales/orders/create/", payload);
        backendOrder = res.data;
      } catch (err: any) {
        console.error("Payment checkout failed", err);
        console.error("Error details:", err.response?.data);
        alert(
          `Payment failed: ${
            err.response?.data
              ? JSON.stringify(err.response.data)
              : "Please try again or contact support."
          }`,
        );
        setProcessingPayment(false);
        return;
      }

      const itemsPayload = cart.map((it: any) => {
        const qty = Number(it.qty) || 0;
        const factor = Number(it.factor) || 1;
        const price = Number(it.price) || 0;
        const lineTotal = price * qty * factor;
        return {
          productPriceId: it.productPriceId,
          productId: it.productId,
          name: it.name,
          qty,
          factor,
          price,
          lineTotal,
        };
      });

      const receiptPayload = {
        items: itemsPayload,
        total: grandTotal,
        createdAt: new Date().toISOString(),
        orderDate: orderDate || new Date().toISOString().split("T")[0],
        customer: currentCustomer,
        payment_amount: payment,
        balance_due,
        payment_status,
      };

      let successMessage = "";
      switch (payment_status) {
        case "paid":
          successMessage = "Payment completed successfully!";
          break;
        case "partial":
          successMessage = "Partial payment received!";
          break;
        case "unpaid":
          successMessage = "Order created successfully (unpaid)!";
          break;
        default:
          successMessage = "Transaction completed!";
      }

      setNavigationState({
        payload: receiptPayload,
        response: backendOrder,
        message: successMessage,
      });

      router.push("/receipt");

      clearCart();
      clearCustomer();
      if (setOrderDate) {
        setOrderDate(new Date().toISOString().split("T")[0]);
      }
    } catch (err: any) {
      console.error("Payment error", err);
      alert(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleFullPayment = () => {
    setPaymentAmount(grandTotal.toFixed(2));
  };

  const handleZeroPayment = () => {
    setPaymentAmount("0.00");
  };

  const calculateChange = () => {
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment < 0) return 0;
    if (payment < grandTotal) return 0;
    return payment - grandTotal;
  };

  const changeAmount = calculateChange();

  const isPaymentAmountValid = () => {
    const payment = parseFloat(paymentAmount);
    return !isNaN(payment) && payment >= 0;
  };

  const getPaymentStatusText = () => {
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment < 0) return "";

    if (payment === 0) return "Order will be created as unpaid";
    if (payment === grandTotal) return "Full payment";
    if (payment > grandTotal) return "Change due";
    if (payment > 0 && payment < grandTotal) return "Partial payment";
    return "";
  };

  const MobileCartButton = () => (
    <button
      onClick={() => setIsCartOpen(true)}
      className="lg:hidden fixed bottom-4 right-4 z-50 bg-linear-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200"
      aria-label="Open cart"
    >
      <div className="relative">
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </div>
    </button>
  );

  const MobileOverlay = () => (
    <div
      className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
        isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setIsCartOpen(false)}
    />
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <MobileCartButton />

      <MobileOverlay />

      <div
        className={`
        lg:w-full lg:h-full lg:bg-linear-to-br lg:from-white lg:to-purple-50 lg:p-3 lg:rounded-2xl lg:shadow-xl lg:border lg:border-purple-200
        fixed lg:relative top-0 right-0 h-screen w-[90vw] max-w-md bg-white z-50 shadow-2xl transition-transform duration-300
        ${isCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}
      >
        <button
          onClick={() => setIsCartOpen(false)}
          className="lg:hidden absolute top-3 left-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Close cart"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex items-center justify-between mb-3 pt-12 lg:pt-0 border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-linear-to-br from-purple-600 to-pink-600 rounded-xl shadow">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base text-gray-800 font-bold m-0">Cart</h3>
              <p className="text-xs text-gray-500 m-0">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </p>
              {orderDate && (
                <p className="text-xs text-purple-600 font-medium m-0 mt-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(orderDate)}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 font-medium">Total</div>
            <div className="text-base font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Rs {grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="h-[calc(100vh-300px)] lg:h-[calc(100%-255px)] overflow-y-auto pr-1 sm:pr-2 pb-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 bg-linear-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                Your cart is empty
              </p>
              <p className="text-gray-400 text-xs">
                Add some products to get started
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-0.5">
              {cart.map((it: any) => {
                const quantity = Number(it.qty) || 0;
                const factor = Number(it.factor) || 0;
                const hasInvalidQuantity = !quantity || quantity <= 0;
                const hasInvalidFactor = !factor || factor <= 0;
                const hasError = hasInvalidQuantity || hasInvalidFactor;

                const displayQty = quantity > 0 ? quantity : "";
                const displayFactor = factor > 0 ? factor : "";

                return (
                  <div
                    key={it.productPriceId}
                    className={`relative p-2 rounded-xl shadow-sm transition-all duration-200 ${
                      hasError
                        ? "bg-linear-to-r from-red-50 to-pink-50 border border-red-300"
                        : "bg-white border border-purple-100 hover:shadow-md hover:border-purple-200"
                    }`}
                  >
                    {hasError && (
                      <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 shadow">
                        <AlertCircle className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div
                      className={`font-semibold text-sm mb-1 flex items-center gap-1 ${
                        hasError ? "text-red-700" : "text-gray-800"
                      }`}
                    >
                      <span className="line-clamp-1">{it.name}</span>
                      {hasError && (
                        <span className="text-[10px] text-red-600 font-semibold px-1.5 py-0.5 bg-red-100 rounded-full">
                          Fix
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1.5">
                      Rs {Number(it.price || 0).toFixed(2)}/kg
                    </div>

                    <div className="space-y-1 mb-2">
                      <div>
                        <label
                          className={`text-[10px] font-bold mb-0.5 block ${
                            hasInvalidQuantity
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          Weight (Kg)
                        </label>
                        <input
                          type="number"
                          value={displayQty}
                          min="1"
                          step="1"
                          onChange={(e) =>
                            updateQuantity(it.productPriceId, e.target.value)
                          }
                          className={`w-full p-1 rounded-lg text-xs font-semibold transition-all ${
                            hasInvalidQuantity
                              ? "border border-red-500 bg-red-50 text-red-700 focus:ring-1 focus:ring-red-200"
                              : "border border-purple-200 bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
                          }`}
                          placeholder="0"
                        />
                        {hasInvalidQuantity && (
                          <span className="text-red-600 text-[9px] font-semibold mt-0.5 block">
                            Must be &gt; 0
                          </span>
                        )}
                      </div>

                      <div>
                        <label
                          className={`text-[10px] font-bold mb-0.5 block ${
                            hasInvalidFactor ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          Factor
                        </label>
                        <input
                          type="number"
                          value={displayFactor}
                          min="0.1"
                          step="0.1"
                          onChange={(e) =>
                            updateFactor(it.productPriceId, e.target.value)
                          }
                          className={`w-full p-1 rounded-lg text-xs font-semibold transition-all ${
                            hasInvalidFactor
                              ? "border border-red-500 bg-red-50 text-red-700 focus:ring-1 focus:ring-red-200"
                              : "border border-purple-200 bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
                          }`}
                          placeholder="0"
                        />
                        {hasInvalidFactor && (
                          <span className="text-red-600 text-[9px] font-semibold mt-0.5 block">
                            Must be &gt; 0
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-500 font-medium">
                          Total
                        </div>
                        <div
                          className={`font-bold text-sm ${
                            hasError
                              ? "text-red-600"
                              : "bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                          }`}
                        >
                          Rs {itemTotal(it).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(it.productPriceId)}
                        className="group p-1.5 rounded-lg bg-linear-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-none text-xs font-bold cursor-pointer shadow-sm hover:shadow transition-all duration-200"
                        title="Remove item"
                      >
                        <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 right-0 p-2.5 lg:p-3 rounded-t-xl lg:rounded-b-2xl shadow-lg backdrop-blur-md transition-all duration-200 ${
              isCheckoutDisabled()
                ? "bg-linear-to-r from-gray-400 to-gray-500"
                : "bg-linear-to-r from-purple-600 via-pink-600 to-purple-600"
            }`}
          >
            <div className="space-y-2">
              {orderDate && (
                <div className="flex items-center justify-between p-2 bg-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-medium">
                      Order Date:
                    </span>
                  </div>
                  <span className="text-white font-semibold text-sm">
                    {orderDate}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-white/80 font-medium">
                      Payment Amount
                    </label>
                    <div className="flex gap-1">
                      <button
                        onClick={handleFullPayment}
                        className="px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded border border-white/30 hover:bg-white/30 transition-colors duration-200"
                        title="Full payment"
                      >
                        Full
                      </button>
                      <button
                        onClick={handleZeroPayment}
                        className="px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded border border-white/30 hover:bg-white/30 transition-colors duration-200"
                        title="Unpaid"
                      >
                        Unpaid
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 text-white transform -translate-y-1/2">
                      RS
                    </div>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-10 pr-3 py-1.5 rounded-lg bg-white/20 text-white placeholder-white/50 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
                    />
                  </div>
                  {isPaymentAmountValid() && paymentAmount !== "" && (
                    <div className="mt-1 text-white/70 text-[10px] font-medium truncate">
                      {getPaymentStatusText()}
                    </div>
                  )}
                </div>
              </div>

              {changeAmount > 0 && (
                <div className="p-2 bg-linear-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-400/30">
                  <div className="flex justify-between items-center">
                    <span className="text-white text-xs font-medium">
                      Change Due:
                    </span>
                    <span className="text-green-300 text-sm lg:text-base font-bold">
                      Rs {changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handlePayment}
                  disabled={
                    isCheckoutDisabled() ||
                    !paymentAmount ||
                    !isPaymentAmountValid() ||
                    processingPayment
                  }
                  className={`flex-1 py-2.5 lg:py-3 px-3 lg:px-4 rounded-lg lg:rounded-xl border-none font-semibold text-xs lg:text-sm shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCheckoutDisabled() ||
                    !paymentAmount ||
                    !isPaymentAmountValid() ||
                    processingPayment
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
                      : "bg-linear-to-r from-green-500 to-emerald-600 text-white cursor-pointer hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  {processingPayment ? (
                    <>
                      <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-3 h-3 lg:w-4 lg:h-4" />
                      {parseFloat(paymentAmount) === 0
                        ? "Create Unpaid Order"
                        : "Pay Now"}
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                {isCheckoutDisabled() ? (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-white/90 font-semibold">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Fix invalid items to checkout
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-white/90 font-semibold">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Ready for payment
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

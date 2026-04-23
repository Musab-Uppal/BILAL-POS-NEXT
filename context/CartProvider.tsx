"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "../lib/api";
import CartContext from "./CartContext";

function setNavigationState(state: unknown) {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      "receipt_navigation_state",
      JSON.stringify(state),
    );
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const router = useRouter();

  const addToCart = (product: any) => {
    setCart((prev) => {
      const found = prev.find(
        (i) => i.productPriceId === product.productPriceId,
      );
      if (found) {
        return prev.map((i) =>
          i.productPriceId === product.productPriceId
            ? { ...i, qty: i.qty + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productPriceId: product.productPriceId,
          productId: product.productId,
          name: product.name,
          price: product.price,
          qty: 1,
          factor: 1,
        },
      ];
    });
  };

  const updateQuantity = (productPriceId: number, qty: number | string) => {
    const q = Number(qty);
    setCart((c) =>
      c.map((it) =>
        it.productPriceId === productPriceId ? { ...it, qty: q } : it,
      ),
    );
  };

  const updateFactor = (productPriceId: number, factor: number | string) => {
    const f = Number(factor);
    setCart((c) =>
      c.map((it) =>
        it.productPriceId === productPriceId ? { ...it, factor: f } : it,
      ),
    );
  };

  const removeFromCart = (productPriceId: number) =>
    setCart((c) => c.filter((it) => it.productPriceId !== productPriceId));

  const clearCart = () => setCart([]);

  const clearCustomer = () => setCurrentCustomer(null);

  const itemTotal = (it: any) =>
    (Number(it.price) || 0) * (Number(it.qty) || 0) * (Number(it.factor) || 1);

  const grandTotal = cart.reduce((s, it) => s + itemTotal(it), 0);

  const isCheckoutDisabled = () => {
    if (!cart || cart.length === 0) return true;
    if (!currentCustomer) return true;
    return cart.some((item) => {
      const quantity = Number(item.qty);
      const factor = Number(item.factor);
      return !quantity || quantity <= 0 || !factor || factor <= 0;
    });
  };

  const handleCheckout = async () => {
    if (isCheckoutDisabled()) {
      if (!currentCustomer) {
        alert("Please select a customer before checkout");
      } else {
        alert("Cannot checkout: fix invalid items");
      }
      return;
    }

    if (!cart || cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const items = cart.map((it) => ({
      product: it.productId,
      quantity: Number(it.qty),
      factor: Number(it.factor) || 1,
      price: (Number(it.price) || 0) * (Number(it.factor) || 1),
    }));

    const paymentAmt = paymentAmount || grandTotal;
    const balanceDue = grandTotal - paymentAmt;
    const paymentStat = balanceDue > 0 ? "partial" : "paid";

    const payload = {
      customer: currentCustomer.id,
      items,
      payment_amount: paymentAmt,
      payment_method: "cash",
      payment_status: paymentStat,
      total_amount: grandTotal,
      balance_due: balanceDue,
      date: orderDate,
    };

    let backendOrder = null;

    try {
      const res = await apiPost("sales/orders/create/", payload);
      backendOrder = res.data;
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout failed – but showing receipt anyway.");
    }

    const itemsPayload = cart.map((it) => {
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
      orderDate,
      customer: currentCustomer,
    };

    setNavigationState({
      payload: receiptPayload,
      response: backendOrder,
    });

    router.push("/receipt");

    clearCart();
    clearCustomer();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        currentCustomer,
        setCurrentCustomer,
        clearCustomer,
        addToCart,
        updateQuantity,
        updateFactor,
        removeFromCart,
        clearCart,
        itemTotal,
        grandTotal,
        isCheckoutDisabled,
        handleCheckout,
        paymentAmount,
        setPaymentAmount,
        paymentStatus,
        setPaymentStatus,
        orderDate,
        setOrderDate,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

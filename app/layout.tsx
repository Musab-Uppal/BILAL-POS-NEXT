import type { Metadata } from "next";
import { ReactNode } from "react";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import Header from "../components/Header";
import { CartProvider } from "../context/CartProvider";

export const metadata: Metadata = {
  title: "Bilal Poultry Traders POS",
  description: "Bilal POS",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader color="#7c3aed" height={3} showSpinner={false} />
        <CartProvider>
          <div
            className="app-root"
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
              background: "#f0f4ff",
            }}
          >
            <Header />

            <main
              className="app-main"
              style={{
                flex: 1,
                padding: "0 1.5rem",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {children}
            </main>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}

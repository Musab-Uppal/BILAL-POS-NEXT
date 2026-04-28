"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, BarChart3, UserPlus, LogOut, Menu, X } from "lucide-react";
import { logout } from "../lib/api";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (
    pathname === "/login" ||
    pathname === "/receipt" ||
    pathname.startsWith("/receipt/")
  ) {
    return null;
  }

  const navigationItems = [
    { path: "/pos", label: "POS", icon: Home },
    { path: "/report", label: "Reports", icon: BarChart3 },
  ];

  const isActivePath = (path: string) => {
    if (path === "/pos") {
      return pathname === "/" || pathname === "/pos";
    }
    return pathname.startsWith(path);
  };

  const navigateTo = (path: string) => {
    setPendingPath(path);
    startTransition(() => {
      router.push(path);
      setIsMenuOpen(false);
    });
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      startTransition(() => {
        router.push("/login");
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-linear-to-r from-purple-600 via-pink-500 to-rose-500 shadow-xl relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
      <div className="hidden sm:block absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
      <div className="hidden sm:block absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>

      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 relative z-10">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden absolute left-3 top-1/2 transform -translate-y-1/2 z-50 text-white p-1"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-2 ml-10 sm:ml-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-md rounded-lg sm:rounded-xl flex items-center justify-center shadow-md sm:shadow-lg">
              <span className="text-xl sm:text-2xl">🐔</span>
            </div>
            <div>
              <h1 className="text-white text-lg sm:text-2xl font-bold tracking-tight">
                Bilal Poultry Traders
              </h1>
              <div className="hidden sm:flex items-center gap-3 mt-0.5">
                <span className="text-white/90 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Fresh poultry rates
                </span>
                <span className="text-white/80 text-xs">•</span>
                <span className="text-white/90 text-xs">Quick sales</span>
                <span className="text-white/80 text-xs">•</span>
                <span className="text-white/90 text-xs">Trusted service</span>
              </div>
            </div>
          </div>

          <nav className="hidden sm:flex items-center justify-center gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  disabled={isPending && pendingPath === item.path}
                  className={`group flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-white/25 text-white shadow-lg backdrop-blur-sm border border-white/30"
                      : "text-white/90 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20"
                  }`}
                >
                  {isPending && pendingPath === item.path ? (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => navigateTo("/add-customer")}
              disabled={isPending && pendingPath === "/add-customer"}
              className="bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
            >
              {isPending && pendingPath === "/add-customer" ? (
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              Add Customer
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 text-sm"
              title="Logout"
            >
              {isLoggingOut ? (
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
              Logout
            </button>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="sm:hidden bg-linear-to-r from-red-500 to-rose-600 text-white px-3 py-1.5 rounded-lg font-semibold shadow-lg flex items-center gap-2 text-sm"
            title="Logout"
          >
            {isLoggingOut ? (
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="sm:hidden fixed inset-0 top-16 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="absolute top-0 left-0 right-0 bg-linear-to-r from-purple-600 via-pink-500 to-rose-500 shadow-lg z-50 animate-slideDown">
            <div className="flex flex-col p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigateTo(item.path)}
                    disabled={isPending && pendingPath === item.path}
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-white/25 text-white backdrop-blur-sm border border-white/30"
                        : "text-white/90 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20"
                    }`}
                  >
                      {isPending && pendingPath === item.path ? (
                        <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    {item.label}
                  </button>
                );
              })}

              <button
                  onClick={() => navigateTo("/add-customer")}
                  disabled={isPending && pendingPath === "/add-customer"}
                className="flex items-center gap-3 px-4 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold transition-all duration-200"
              >
                  {isPending && pendingPath === "/add-customer" ? (
                    <span className="inline-block h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;

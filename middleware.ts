import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getAdminIdentifiers() {
  const raw = [
    process.env.ADMIN_USERNAME,
    process.env.USERNAME,
    process.env.USER1NAME,
    process.env.USER2NAME,
  ];

  return Array.from(
    new Set(
      raw
        .map((value) =>
          String(value || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
  );
}

function isAdminUser(user: any, adminIdentifiers: string[]) {
  if (!user || adminIdentifiers.length === 0) return false;

  const email = String(user.email || "").toLowerCase();
  const emailLocalPart = email.includes("@") ? email.split("@")[0] : email;
  const metadataUsername = String(
    user.user_metadata?.username || "",
  ).toLowerCase();

  return (
    adminIdentifiers.includes(email) ||
    adminIdentifiers.includes(emailLocalPart) ||
    adminIdentifiers.includes(metadataUsername)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const hasAuthCookies = request.cookies
    .getAll()
    .some((cookie) => /sb-|supabase|auth-token/i.test(cookie.name));

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    // If Supabase auth is temporarily unreachable, do not block the route.
    // Keep the app usable for existing sessions instead of failing the page load.
    console.warn("middleware auth check failed", error);

    if (!hasAuthCookies && request.nextUrl.pathname !== "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";
  const adminIdentifiers = getAdminIdentifiers();

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const isAdmin = isAdminUser(user, adminIdentifiers);

    if (!isAdmin) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn("middleware signOut failed", error);
      }

      if (!isLoginRoute) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("unauthorized", "1");
        return NextResponse.redirect(url);
      }

      return response;
    }

    if (isLoginRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/pos";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};

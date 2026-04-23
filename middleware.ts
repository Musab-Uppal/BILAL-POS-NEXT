import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function isAdminUser(user: any, adminIdentifier: string | undefined) {
  if (!user || !adminIdentifier) return false;

  const normalized = adminIdentifier.trim().toLowerCase();
  const email = String(user.email || "").toLowerCase();
  const emailLocalPart = email.includes("@") ? email.split("@")[0] : email;
  const metadataUsername = String(
    user.user_metadata?.username || "",
  ).toLowerCase();

  return (
    email === normalized ||
    emailLocalPart === normalized ||
    metadataUsername === normalized
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/login";
  const adminIdentifier = process.env.USERNAME;

  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const isAdmin = isAdminUser(user, adminIdentifier);

    if (!isAdmin) {
      await supabase.auth.signOut();

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

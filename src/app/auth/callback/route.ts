import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, isSupabaseConfigured } from "@/lib/env";
import { errorContext, logServerEvent } from "@/lib/observability";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!isSupabaseConfigured || !code) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("user_profiles").upsert({
        id: user.id,
        email: user.email ?? "",
        last_sign_in_at: new Date().toISOString(),
      });
    }

    return response;
  } catch (error) {
    logServerEvent("error", "Auth callback failed", {
      route: "/auth/callback",
      hasCode: Boolean(code),
      ...errorContext(error),
    });

    return NextResponse.redirect(new URL("/?auth=callback-error", request.url));
  }
}

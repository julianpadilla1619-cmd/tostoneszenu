import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas protegidas → roles que pueden entrar. Las páginas vuelven a verificar
// en el servidor (requirePage) y la base de datos aplica RLS: tres capas.
const PROTECTED: [string, string[]][] = [
  ["/admin", ["admin"]],
  ["/app", ["mayorista"]],
  ["/inversor", ["inversionista", "admin"]],
  ["/cambiar-clave", ["admin", "mayorista", "inversionista"]],
];

const homeFor = (role: string) => (role === "admin" ? "/admin" : role === "inversionista" ? "/inversor" : "/app");

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Refresca la sesión (y las cookies) en cada request. getUser() valida el token con Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const rule = PROTECTED.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!rule && pathname !== "/login") return response;

  const redirectTo = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (!user) return rule ? redirectTo("/login") : response;

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle();
  const active = profile?.status === "activo";

  if (pathname === "/login") return active ? redirectTo(homeFor(profile!.role)) : response;
  const [, roles] = rule!;
  if (!active || !roles.includes(profile!.role)) {
    const home = active ? homeFor(profile!.role) : "/login";
    // Nunca redirigir a la misma ruta (evita ciclos).
    return home === pathname ? response : redirectTo(home);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\.ico|sw\.js|manifest\.webmanifest|icons/|brand/|api/cron).*)"],
};

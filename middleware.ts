import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
  };

  export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

      if (pathname.startsWith("/api/admin/auth/")) {
          return NextResponse.next();
            }

              const isAdmin = req.cookies.get("synergos_is_admin")?.value === "1";
                const hasSession = !!req.cookies.get("synergos_admin_session")?.value;

                  const isAuthenticated = isAdmin && hasSession;

                    if (pathname.startsWith("/api/admin/")) {
                        if (!isAuthenticated) {
                              return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
                                  }
                                      return NextResponse.next();
                                        }

                                          if (!isAuthenticated) {
                                              const loginUrl = new URL("/login", req.url);
                                                  return NextResponse.redirect(loginUrl);
                                                    }

                                                      return NextResponse.next();
                                                      }
                                                      

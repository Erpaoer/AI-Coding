// 路由守卫 —— Next.js 16 使用 proxy.ts 替代 middleware.ts
// 运行在 Node.js runtime（非 Edge），支持 jose 的 jwtVerify

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/** 启动时强制校验 JWT_SECRET */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[致命错误] JWT_SECRET 环境变量未设置或长度不足（≥32 字符）。\n" +
      "请执行: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secret);
}

const SECRET = getSecret();

// 需要登录的路由前缀
const AUTH_ROUTES = ["/cart", "/orders", "/api/cart", "/api/orders"];
// 需要 ADMIN 角色的路由前缀
const ADMIN_ROUTES = ["/admin", "/api/admin"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // 判断是否需要 ADMIN 权限
  const needsAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  // 判断是否需要登录
  const needsAuth =
    needsAdmin || AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // 公开路由直接放行
  if (!needsAuth) return NextResponse.next();

  // 未登录
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    // 页面路由 → 重定向登录页
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 校验 JWT（proxy 运行在 Node.js，可以用 .then() 链式调用）
  return jwtVerify(token, SECRET).then(
    ({ payload }) => {
      // 检查 ADMIN 权限
      if (needsAdmin && payload.role !== "ADMIN") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/", req.url));
      }

      // 认证通过，将用户信息通过 request header 传递给下游
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", String(payload.sub));
      requestHeaders.set("x-user-role", String(payload.role));
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    },
    () => {
      // JWT 无效或过期
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "登录已过期" }, { status: 401 });
      }
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete("token");
      return res;
    }
  );
}

// 路由匹配器：只有匹配的路由才触发 proxy
export const config = {
  matcher: [
    "/cart",
    "/orders/:path*",
    "/admin/:path*",
    "/api/cart",
    "/api/orders/:path*",
    "/api/admin/:path*",
  ],
};

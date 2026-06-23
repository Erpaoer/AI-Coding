// API 路由内联认证守卫
// 由于 Next.js 16.2.9 + Turbopack 下 middleware/proxy 可能不被拦截，
// 每个 API Route Handler 开头调用此函数做防御性认证
//
// 用法：
//   const auth = await requireAuth();
//   if (auth instanceof NextResponse) return auth;
//   const userId = Number(auth.sub);

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyJWT } from "./auth";

/** 要求登录，返回 JWT payload；未登录/过期返回 401 错误响应 */
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    return await verifyJWT(token);
  } catch {
    return NextResponse.json({ error: "登录已过期，请重新登录" }, { status: 401 });
  }
}

/** 要求 ADMIN 角色，返回 JWT payload；非 ADMIN 返回 403 */
export async function requireAdmin() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }
  return auth;
}

// GET /api/auth/me — 返回当前登录用户信息（从 cookie JWT 解析）
// 公开接口，未登录返回 401

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "未登录" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    id: Number(user.sub),
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

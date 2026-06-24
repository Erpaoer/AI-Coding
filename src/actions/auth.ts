"use server";

// 认证 Server Actions：登录、注册、登出
// 使用 bcryptjs + jose JWT + httpOnly cookie

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signJWT, comparePassword, hashPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import { authRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/types";

/** bcrypt 哑哈希，用于防御时序侧信道邮箱枚举 */
const DUMMY_BCRYPT_HASH = "$2a$12$LJ3m4ys3Wg8P0sXK7vRbYu0GvF9oMFZBs3RnVZGpD8sM5pFhaLXqK";

/** 从请求中提取客户端 IP */
async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * 登录 Action
 * 1. Zod 校验 email + password
 * 2. 查用户是否存在
 * 3. bcrypt 比对密码
 * 4. 签发 JWT → 写入 httpOnly cookie
 * 5. 重定向到首页
 */
export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 频率限制：每 IP 每分钟 5 次
  const ip = await getClientIP();
  const limit = authRateLimit(ip, "login");
  if (!limit.allowed) {
    return { error: "请求过于频繁，请稍后再试" };
  }

  // 字段提取
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Zod 校验
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "请检查输入",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { email, password } = parsed.data;

  // 查找用户
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, password: true },
  });

  // 固定时间比对：即使邮箱不存在也执行 bcrypt（防御时序侧信道）
  const passwordMatch = await comparePassword(password, user?.password ?? DUMMY_BCRYPT_HASH);

  if (!user || !passwordMatch) {
    return { error: "邮箱或密码错误" };
  }

  // 签发 JWT，有效 4 小时
  const token = await signJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // 写入 httpOnly cookie（Next.js 16: cookies() 必须 await）
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 与 JWT 4h 一致
  });

  // 重定向到首页
  redirect("/");
}

/**
 * 注册 Action
 * 1. Zod 校验 name + email + password + confirmPassword
 * 2. 检查邮箱是否已注册
 * 3. bcrypt 哈希密码
 * 4. 创建用户
 * 5. 签发 JWT → 写入 httpOnly cookie
 * 6. 重定向到首页
 */
export async function registerAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 频率限制：每 IP 每分钟 3 次
  const ip = await getClientIP();
  const limit = authRateLimit(ip, "register");
  if (!limit.allowed) {
    return { error: "请求过于频繁，请稍后再试" };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  // Zod 校验
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "请检查输入",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { name, email, password } = parsed.data;

  // 检查邮箱是否已注册
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return {
      error: "该邮箱已被注册",
      fieldErrors: { email: ["该邮箱已被注册"] },
    };
  }

  // 创建用户
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "USER" },
    select: { id: true, email: true, name: true, role: true },
  });

  // 签发 JWT
  const token = await signJWT({
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
  });

  // 写入 cookie
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 与 JWT 4h 一致
  });

  redirect("/");
}

/**
 * 登出 Action
 * 删除 token cookie → 重定向到登录页
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}

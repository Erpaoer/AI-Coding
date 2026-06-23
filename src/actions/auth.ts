"use server";

// 认证 Server Actions：登录、注册、登出
// 使用 bcryptjs + jose JWT + httpOnly cookie

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { signJWT, comparePassword, hashPassword } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { ActionState } from "@/types";

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

  if (!user) {
    return { error: "邮箱或密码错误" };
  }

  // 比对密码
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return { error: "邮箱或密码错误" };
  }

  // 签发 JWT，有效 24 小时
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
    maxAge: 60 * 60 * 24, // 24 小时
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
    maxAge: 60 * 60 * 24,
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

// 认证工具：JWT 签发/校验 + 密码哈希/比对 + 获取当前用户

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";

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

/** JWT payload 类型（兼容 jose 的 JWTPayload index signature） */
export interface JwtPayload {
  sub: string;   // 用户 ID
  email: string;
  name: string;  // 用户姓名，Header 直接展示无需查 DB
  role: string;
  [key: string]: unknown;
}

/** Zod schema 用于运行时校验 JWT 负载结构 */
const jwtPayloadSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

/** 签发 JWT，有效期 4 小时（含 jti 用于未来撤销） */
export async function signJWT(payload: JwtPayload) {
  return new SignJWT({ ...payload, jti: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("4h")
    .setIssuedAt()
    .sign(SECRET);
}

/** 校验 JWT 签名 + 结构，返回 payload 或抛出异常 */
export async function verifyJWT(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, SECRET);
  const parsed = jwtPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("Invalid token payload structure");
  }
  return parsed.data as JwtPayload;
}

/** 从 cookie 中获取当前登录用户，未登录返回 null */
// Next.js 16: cookies() 必须 await
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    return await verifyJWT(token);
  } catch {
    return null;
  }
}

/** bcryptjs 哈希密码，12 轮盐值 */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

/** bcryptjs 比对明文和哈希 */
export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

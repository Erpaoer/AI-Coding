// 认证工具：JWT 签发/校验 + 密码哈希/比对 + 获取当前用户

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

/** 签发 JWT，有效期 24 小时 */
export async function signJWT(payload: {
  sub: string; // 用户 ID
  email: string;
  role: string;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);
}

/** 校验 JWT，返回 payload 或抛出异常 */
export async function verifyJWT(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload as { sub: string; email: string; role: string };
}

/** 从 cookie 中获取当前登录用户，未登录返回 null */
// Next.js 16: cookies() 必须 await
export async function getCurrentUser() {
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

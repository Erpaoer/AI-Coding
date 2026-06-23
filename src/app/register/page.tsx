// 注册页 —— 已登录用户自动重定向到首页
// Server Component

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  // 已登录 → 重定向到首页
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RegisterForm />
    </div>
  );
}

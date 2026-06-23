"use client";

// 登出按钮 —— 调用 logoutAction 清除 cookie 并跳转登录页

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm">
        退出登录
      </Button>
    </form>
  );
}

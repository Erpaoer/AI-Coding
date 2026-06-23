"use client";

// 登录表单组件
// 使用 React 19 的 useActionState 管理表单状态

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">🔐 登录</h2>
        <p className="text-sm text-muted mt-1">
          欢迎回来，请输入您的账号信息
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {/* 全局错误 */}
          {state.error && !state.fieldErrors && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-md border border-danger/30">
              {state.error}
            </div>
          )}

          {/* 邮箱 */}
          <Input
            label="邮箱"
            name="email"
            type="email"
            placeholder="admin@minimall.com"
            autoComplete="email"
            error={state.fieldErrors?.email?.[0]}
            required
          />

          {/* 密码 */}
          <Input
            label="密码"
            name="password"
            type="password"
            placeholder="••••••"
            autoComplete="current-password"
            error={state.fieldErrors?.password?.[0]}
            required
          />

          {/* 提交 */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "登录中..." : "登录"}
          </Button>

          {/* 跳转注册 */}
          <p className="text-center text-sm text-muted">
            还没有账号？{" "}
            <Link
              href="/register"
              className="text-primary hover:underline"
            >
              立即注册
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

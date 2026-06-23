"use client";

// 注册表单组件
// 使用 React 19 的 useActionState 管理表单状态

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">📝 注册</h2>
        <p className="text-sm text-muted mt-1">
          创建您的 Mini Mall 账号
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

          {/* 姓名 */}
          <Input
            label="姓名"
            name="name"
            type="text"
            placeholder="您的姓名"
            autoComplete="name"
            error={state.fieldErrors?.name?.[0]}
            required
          />

          {/* 邮箱 */}
          <Input
            label="邮箱"
            name="email"
            type="email"
            placeholder="user@minimall.com"
            autoComplete="email"
            error={state.fieldErrors?.email?.[0]}
            required
          />

          {/* 密码 */}
          <Input
            label="密码"
            name="password"
            type="password"
            placeholder="至少 6 位"
            autoComplete="new-password"
            error={state.fieldErrors?.password?.[0]}
            required
          />

          {/* 确认密码 */}
          <Input
            label="确认密码"
            name="confirmPassword"
            type="password"
            placeholder="再次输入密码"
            autoComplete="new-password"
            error={state.fieldErrors?.confirmPassword?.[0]}
            required
          />

          {/* 提交 */}
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "注册中..." : "注册"}
          </Button>

          {/* 跳转登录 */}
          <p className="text-center text-sm text-muted">
            已有账号？{" "}
            <Link
              href="/login"
              className="text-primary hover:underline"
            >
              立即登录
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

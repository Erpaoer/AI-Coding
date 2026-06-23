// 共享 TypeScript 类型定义

import type { Role, OrderStatus } from "@/lib/constants";

/** JWT payload 中的用户信息 */
export interface UserPayload {
  sub: string; // 用户 ID（JWT 标准字段）
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

/** 分页响应结构 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

/** Server Action 的返回状态 */
export interface ActionState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/** 订单状态 */
export type { Role, OrderStatus };

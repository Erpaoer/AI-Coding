// Zod 校验 Schema —— 用于 Server Action 和表单校验

import { z } from "zod";
import { ORDER_STATUSES } from "./constants";

// ─── 登录 ───
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 位"),
});

// ─── 注册 ───
export const registerSchema = z
  .object({
    name: z.string().min(1, "请输入姓名"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(8, "密码至少 8 位"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

// ─── 商品创建/编辑 ───
export const productSchema = z.object({
  name: z.string().min(1, "请输入商品名称").max(100, "名称不能超过 100 字"),
  description: z
    .string()
    .min(1, "请输入商品描述")
    .max(5000, "描述不能超过 5000 字"),
  price: z.coerce.number().positive("价格必须大于 0"),
  stock: z.coerce.number().int("库存必须为整数").min(0, "库存不能为负数"),
  categoryId: z.coerce.number({ message: "请选择分类" }).int(),
});

// ─── 分类创建/编辑 ───
export const categorySchema = z.object({
  name: z.string().min(1, "请输入分类名称").max(50, "名称不能超过 50 字"),
});

// ─── 订单状态更新 ───
export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { message: "无效的订单状态" }),
});

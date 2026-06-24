"use client";

// 商品表单 —— 新增/编辑复用
// 通过 fetch 调用 /api/admin/products（POST 创建 / PUT 更新）

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";

interface Category {
  id: number;
  name: string;
}

interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  isActive: boolean;
  imageUrl?: string | null;
}

interface ProductFormProps {
  categories: Category[];
  mode: "create" | "edit";
  productId?: number;
  defaultValues?: ProductFormValues;
}

export function ProductForm({
  categories,
  mode,
  productId,
  defaultValues,
}: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isEdit = mode === "edit";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);

    setSubmitting(true);

    try {
      const url = isEdit
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: formData, // FormData，浏览器自动设置 Content-Type
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setError(data.error || "操作失败");
        return;
      }

      // 成功 → 跳转列表页
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* 全局错误 */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-danger">
          {error}
        </div>
      )}

      {/* 商品名称 */}
      <Input
        label="商品名称"
        name="name"
        placeholder="输入商品名称"
        defaultValue={defaultValues?.name}
        error={fieldErrors.name?.[0]}
        required
        maxLength={100}
      />

      {/* 商品描述 */}
      <Textarea
        label="商品描述"
        name="description"
        placeholder="输入商品详细介绍"
        defaultValue={defaultValues?.description}
        error={fieldErrors.description?.[0]}
        rows={6}
        required
      />

      {/* 价格 + 库存 并排 */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="价格 (¥)"
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          defaultValue={defaultValues?.price}
          error={fieldErrors.price?.[0]}
          required
        />
        <Input
          label="库存"
          name="stock"
          type="number"
          step="1"
          min="0"
          placeholder="0"
          defaultValue={defaultValues?.stock}
          error={fieldErrors.stock?.[0]}
          required
        />
      </div>

      {/* 分类 */}
      <Select
        label="所属分类"
        name="categoryId"
        options={categoryOptions}
        placeholder="请选择分类"
        defaultValue={defaultValues?.categoryId}
        error={fieldErrors.categoryId?.[0]}
        required
      />

      {/* 上架状态（仅编辑模式） */}
      {/* checkbox 在前：勾选时 FormData.get("isActive") → "true"；未勾选时到 hidden → "false" */}
      {isEdit && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={defaultValues?.isActive ?? true}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <input type="hidden" name="isActive" value="false" />
          <span>上架（用户可见）</span>
        </label>
      )}

      {/* 图片上传 */}
      <ImageUpload
        name="image"
        defaultImageUrl={defaultValues?.imageUrl}
      />

      {/* 提交按钮 */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting
            ? isEdit
              ? "保存中..."
              : "创建中..."
            : isEdit
            ? "💾 保存修改"
            : "✨ 创建商品"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.back()}
          disabled={submitting}
        >
          取消
        </Button>
      </div>
    </form>
  );
}

"use client";

// 商品表格操作按钮 —— 编辑 + 删除
// Client Component：删除需要确认 + fetch 调用

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductTableActionsProps {
  productId: number;
  productName: string;
}

export function ProductTableActions({
  productId,
  productName,
}: ProductTableActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`确定要删除商品「${productName}」吗？此操作不可撤销。`)) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "删除失败");
        return;
      }

      router.refresh();
    } catch {
      alert("网络错误，请重试");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 justify-end">
      <Link href={`/admin/products/${productId}/edit`}>
        <Button variant="ghost" size="sm">
          编辑
        </Button>
      </Link>
      <Button
        variant="danger"
        size="sm"
        disabled={deleting}
        onClick={handleDelete}
      >
        {deleting ? "..." : "删除"}
      </Button>
    </div>
  );
}

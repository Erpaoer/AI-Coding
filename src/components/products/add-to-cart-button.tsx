"use client";

// 加入购物车按钮 —— 调用 POST /api/cart
// 未登录时跳转登录页，已登录则添加商品并刷新购物车计数

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: number;
  productName: string;
  stock: number;
  disabled?: boolean;
}

export function AddToCartButton({
  productId,
  productName,
  stock,
  disabled = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const isOutOfStock = stock <= 0;

  const handleClick = async () => {
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (res.status === 401) {
        // 未登录 → 跳转登录页
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "加入购物车失败" });
        return;
      }

      setFeedback({ type: "success", message: `「${productName}」已加入购物车` });
      router.refresh();

      // 3 秒后清除提示
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: "error", message: "网络错误，请重试" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={handleClick}
        disabled={disabled || isOutOfStock || loading}
        size="lg"
        className="w-full sm:w-auto min-w-[140px]"
      >
        {loading ? "添加中..." : isOutOfStock ? "暂时缺货" : "🛒 加入购物车"}
      </Button>
      {feedback && (
        <p
          className={`text-xs ${
            feedback.type === "success" ? "text-success" : "text-danger"
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}

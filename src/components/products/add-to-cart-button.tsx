"use client";

// 加入购物车按钮 —— 客户端交互，后续 Phase 5 对接 Cart Action
// 当前为占位：点击弹出提示"请先登录"

import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: number;
  productName: string;
  stock: number;
  disabled?: boolean;
}

export function AddToCartButton({
  productId: _productId,
  productName,
  stock,
  disabled = false,
}: AddToCartButtonProps) {
  const isOutOfStock = stock <= 0;

  const handleClick = () => {
    // Phase 5 实现：调用 addToCart Server Action
    alert(`「${productName}」已加入购物车！（购物车功能将在后续阶段实现）`);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || isOutOfStock}
      size="lg"
      className="w-full sm:w-auto"
    >
      {isOutOfStock ? "暂时缺货" : "🛒 加入购物车"}
    </Button>
  );
}

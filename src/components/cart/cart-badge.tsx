"use client";

// 购物车数量徽标 —— 客户端组件
// 从 /api/cart 获取购物车数据，显示商品总件数
// 放在 Header 的 "购物车" 链接旁

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function CartBadge() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // 购物车页面内不需要徽标
    if (pathname === "/cart") return;

    let cancelled = false;
    fetch("/api/cart")
      .then((res) => {
        if (res.status === 401) return null; // 未登录，不展示
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        // 只统计上架商品的总件数
        const total = (data.items || []).reduce(
          (sum: number, item: { product: { isActive: boolean }; quantity: number }) =>
            item.product.isActive ? sum + item.quantity : sum,
          0
        );
        setCount(total);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [pathname]);

  // 未登录或计数为 0 时不展示徽标
  if (count === null || count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-3 bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
      {count > 99 ? "99+" : count}
    </span>
  );
}

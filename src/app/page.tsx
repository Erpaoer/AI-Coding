// 首页 —— 商品浏览（Phase 4 完善，此处为占位）

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">欢迎来到 Mini Mall 🛍️</h1>
      <p className="text-muted mb-8 text-lg">
        一个微型电商项目，基于 Next.js 16 + TypeScript + Prisma + SQLite
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/products"
          className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors"
        >
          浏览商品
        </Link>
        <Link
          href="/register"
          className="inline-block border border-border px-6 py-3 rounded-md hover:bg-muted-background transition-colors"
        >
          注册账号
        </Link>
      </div>
    </div>
  );
}

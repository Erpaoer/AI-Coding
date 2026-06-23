// 自定义 404 页面

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-muted mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">页面未找到</h2>
      <p className="text-muted mb-6">您访问的页面不存在或已被移除。</p>
      <Link
        href="/"
        className="bg-primary text-white px-5 py-2 rounded-md hover:bg-primary-dark transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}

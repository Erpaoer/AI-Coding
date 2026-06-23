"use client";

// 全局错误边界

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("页面出错了:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-bold mb-2">出错了 😥</h2>
      <p className="text-muted mb-6">
        {error.message || "发生了一些错误，请稍后再试。"}
      </p>
      <button
        onClick={reset}
        className="bg-primary text-white px-5 py-2 rounded-md hover:bg-primary-dark transition-colors"
      >
        重试
      </button>
    </div>
  );
}
